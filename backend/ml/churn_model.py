"""
Comprehensive Churn Prediction Model for MedRetain CRM.
Uses GradientBoostingClassifier with advanced feature engineering,
cross-validation, feature importance analysis, and patient-specific insights.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import warnings
warnings.filterwarnings('ignore')

# Model paths
MODEL_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(MODEL_DIR, "churn_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")
LABEL_ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoder.pkl")
FEATURE_CONFIG_PATH = os.path.join(MODEL_DIR, "feature_config.json")
MODEL_METRICS_PATH = os.path.join(MODEL_DIR, "model_metrics.json")

# Feature definitions
FEATURE_NAMES = [
    # Core behavioral features
    'days_since_last_visit',
    'no_show_rate',
    'total_appointments',
    'completed_visits',
    'satisfaction_score',
    'is_chronic',
    'visit_frequency_per_year',
    # Derived engagement features
    'completion_rate',
    'cancelled_rate',
    'engagement_score',
    # Financial features
    'payment_reliability',
    'avg_bill_per_visit',
    'lifetime_value_normalized',
    # Demographics
    'age',
    'age_group',
    # Time-based features
    'days_since_registration',
    'tenure_months',
    # Risk indicators
    'recent_no_show',
    'high_no_show_risk',
    'payment_pending_risk',
]

# Recommendations templates
RECOMMENDATIONS = {
    'high_days_since_visit': {
        'factor': 'Long time since last visit',
        'recommendation': 'Schedule a follow-up appointment reminder via preferred contact method',
        'priority': 'high'
    },
    'high_no_show_rate': {
        'factor': 'High no-show rate',
        'recommendation': 'Send appointment reminders 24h and 2h before scheduled visits; consider offering flexible scheduling',
        'priority': 'high'
    },
    'low_satisfaction': {
        'factor': 'Low satisfaction score',
        'recommendation': 'Initiate patient experience survey; schedule call with patient relations team',
        'priority': 'high'
    },
    'low_visit_frequency': {
        'factor': 'Declining visit frequency',
        'recommendation': 'Send personalized wellness check-in; offer preventive care package',
        'priority': 'medium'
    },
    'payment_issues': {
        'factor': 'Payment reliability concerns',
        'recommendation': 'Offer flexible payment plans; discuss insurance coverage options',
        'priority': 'medium'
    },
    'chronic_irregular': {
        'factor': 'Chronic patient with irregular visits',
        'recommendation': 'Enroll in chronic care management program; schedule regular follow-ups',
        'priority': 'high'
    },
    'elderly_at_risk': {
        'factor': 'Elderly patient showing disengagement',
        'recommendation': 'Arrange home visit or telehealth consultation; engage family members',
        'priority': 'high'
    },
    'young_disengaged': {
        'factor': 'Young patient with low engagement',
        'recommendation': 'Offer digital communication channels; provide mobile app access',
        'priority': 'medium'
    },
    'high_value_declining': {
        'factor': 'High-value patient showing churn signals',
        'recommendation': 'Assign dedicated patient coordinator; offer VIP services',
        'priority': 'critical'
    },
    'new_patient_struggling': {
        'factor': 'New patient with early churn indicators',
        'recommendation': 'Conduct onboarding follow-up call; ensure smooth care transition',
        'priority': 'medium'
    }
}


def encode_is_chronic(value):
    """Encode is_chronic field: Yes=1, No=0."""
    if pd.isna(value):
        return 0
    return 1 if str(value).strip().lower() == "yes" else 0


def encode_outcome(value):
    """Encode outcome to risk score."""
    outcome_risk = {
        'Recovered': 0.1,
        'Stable': 0.2,
        'Discharged': 0.3,
        'Under Treatment': 0.4,
        'Referred': 0.5,
        'Critical': 0.6,
        'Deceased': 0.0  # Not applicable for churn
    }
    return outcome_risk.get(str(value).strip(), 0.3)


def encode_payment_status(value):
    """Encode payment status to reliability score."""
    status_score = {
        'Paid': 1.0,
        'Partial': 0.6,
        'Pending': 0.3,
        'Failed': 0.0
    }
    return status_score.get(str(value).strip(), 0.5)


def categorize_age(age):
    """Categorize age into groups."""
    if age < 30:
        return 0  # Young adult
    elif age < 50:
        return 1  # Middle age
    elif age < 65:
        return 2  # Senior
    else:
        return 3  # Elderly


def engineer_features(df):
    """
    Comprehensive feature engineering from raw patient data.

    Args:
        df: DataFrame with patient data

    Returns:
        feature_df: DataFrame with engineered features
        feature_names: List of feature column names
    """
    feature_df = pd.DataFrame()

    # Core behavioral features
    feature_df['days_since_last_visit'] = pd.to_numeric(
        df['days_since_last_visit'], errors='coerce'
    ).fillna(365)

    feature_df['no_show_rate'] = pd.to_numeric(
        df['no_show_rate'], errors='coerce'
    ).fillna(0)

    feature_df['total_appointments'] = pd.to_numeric(
        df['total_appointments'], errors='coerce'
    ).fillna(0)

    feature_df['completed_visits'] = pd.to_numeric(
        df['completed_visits'], errors='coerce'
    ).fillna(0)

    feature_df['satisfaction_score'] = pd.to_numeric(
        df['satisfaction_score'], errors='coerce'
    ).fillna(3.0)

    feature_df['is_chronic'] = df['is_chronic'].apply(encode_is_chronic)

    feature_df['visit_frequency_per_year'] = pd.to_numeric(
        df['visit_frequency_per_year'], errors='coerce'
    ).fillna(0).clip(lower=0)

    # Derived engagement features
    feature_df['completion_rate'] = np.where(
        feature_df['total_appointments'] > 0,
        feature_df['completed_visits'] / feature_df['total_appointments'],
        0
    )

    # Handle missing columns gracefully
    if 'cancelled_count' in df.columns:
        cancelled_count = pd.to_numeric(df['cancelled_count'], errors='coerce').fillna(0)
    else:
        cancelled_count = pd.Series([0] * len(df))
    feature_df['cancelled_rate'] = np.where(
        feature_df['total_appointments'] > 0,
        cancelled_count / feature_df['total_appointments'],
        0
    )

    # Engagement score: combines multiple engagement indicators
    feature_df['engagement_score'] = (
        feature_df['completion_rate'] * 0.4 +
        (1 - feature_df['no_show_rate']) * 0.3 +
        (feature_df['satisfaction_score'] / 5.0) * 0.3
    )

    # Financial features
    if 'total_billed' in df.columns:
        total_billed = pd.to_numeric(df['total_billed'], errors='coerce').fillna(0)
    else:
        total_billed = pd.Series([0] * len(df))
    if 'total_paid' in df.columns:
        total_paid = pd.to_numeric(df['total_paid'], errors='coerce').fillna(0)
    else:
        total_paid = pd.Series([0] * len(df))
    feature_df['payment_reliability'] = np.where(
        total_billed > 0,
        np.clip(total_paid / total_billed, 0, 1),
        1.0
    )

    if 'avg_bill_per_visit' in df.columns:
        feature_df['avg_bill_per_visit'] = pd.to_numeric(df['avg_bill_per_visit'], errors='coerce').fillna(0)
    else:
        feature_df['avg_bill_per_visit'] = 0

    if 'lifetime_value_inr' in df.columns:
        lifetime_value = pd.to_numeric(df['lifetime_value_inr'], errors='coerce').fillna(0)
    else:
        lifetime_value = pd.Series([0] * len(df))
    # Normalize lifetime value using log transform
    feature_df['lifetime_value_normalized'] = np.log1p(lifetime_value) / 15  # Normalize to ~0-1

    # Demographics
    if 'age' in df.columns:
        feature_df['age'] = pd.to_numeric(df['age'], errors='coerce').fillna(40)
    else:
        feature_df['age'] = 40
    feature_df['age_group'] = feature_df['age'].apply(categorize_age)

    # Time-based features
    if 'days_since_registration' in df.columns:
        feature_df['days_since_registration'] = pd.to_numeric(df['days_since_registration'], errors='coerce').fillna(365)
    else:
        feature_df['days_since_registration'] = 365
    feature_df['tenure_months'] = feature_df['days_since_registration'] / 30.44

    # Risk indicators
    if 'latest_appointment_status' in df.columns:
        feature_df['recent_no_show'] = (df['latest_appointment_status'].fillna('').str.strip() == 'No-show').astype(int)
    else:
        feature_df['recent_no_show'] = 0

    feature_df['high_no_show_risk'] = (feature_df['no_show_rate'] > 0.3).astype(int)

    if 'latest_payment_status' in df.columns:
        payment_status = df['latest_payment_status'].fillna('Paid')
        feature_df['payment_pending_risk'] = payment_status.isin(['Pending', 'Failed']).astype(int)
    else:
        feature_df['payment_pending_risk'] = 0

    return feature_df, FEATURE_NAMES


def prepare_features(df):
    """
    Prepare feature matrix from dataframe (compatibility wrapper).

    Args:
        df: DataFrame with patient data

    Returns:
        X: Feature matrix as numpy array
        feature_names: List of feature names
    """
    feature_df, feature_names = engineer_features(df)
    return feature_df[feature_names].values, feature_names


def encode_target(df):
    """
    Encode churn_risk_label: High=2, Medium=1, Low=0

    Args:
        df: DataFrame with churn_risk_label column

    Returns:
        y: Encoded target array
        label_encoder: Fitted LabelEncoder
    """
    label_encoder = LabelEncoder()
    label_encoder.fit(['Low', 'Medium', 'High'])

    # Handle any missing or invalid labels
    labels = df['churn_risk_label'].fillna('Medium')
    labels = labels.apply(lambda x: x if x in ['Low', 'Medium', 'High'] else 'Medium')

    y = label_encoder.transform(labels)
    return y, label_encoder


def train_model(csv_path, verbose=True):
    """
    Train the churn prediction model with cross-validation.

    Args:
        csv_path: Path to the CSV file with patient data
        verbose: Whether to print progress

    Returns:
        model: Trained GradientBoostingClassifier
        label_encoder: Fitted label encoder
        accuracy: Model accuracy on test set
        report: Classification report
    """
    if verbose:
        print("Loading data from CSV...")
    df = pd.read_csv(csv_path)

    if verbose:
        print(f"Loaded {len(df)} patient records")
        print(f"Columns: {len(df.columns)}")

    # Engineer features
    if verbose:
        print("\nEngineering features...")
    feature_df, feature_names = engineer_features(df)
    X = feature_df[feature_names].values
    y, label_encoder = encode_target(df)

    if verbose:
        print(f"Features: {len(feature_names)}")
        print(f"Class distribution: Low={sum(y==0)}, Medium={sum(y==1)}, High={sum(y==2)}")

    # Initialize scaler and transform features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Split data
    if verbose:
        print("\nSplitting data (80% train, 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )

    if verbose:
        print(f"Training set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples")

    # Cross-validation
    if verbose:
        print("\nPerforming 5-fold cross-validation...")

    model = GradientBoostingClassifier(
        n_estimators=150,
        learning_rate=0.1,
        max_depth=5,
        min_samples_split=10,
        min_samples_leaf=5,
        subsample=0.8,
        random_state=42,
        verbose=0
    )

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring='accuracy')

    if verbose:
        print(f"CV Scores: {cv_scores}")
        print(f"Mean CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")

    # Train final model
    if verbose:
        print("\nTraining final GradientBoostingClassifier...")
    model.fit(X_train, y_train)

    # Evaluate on test set
    if verbose:
        print("\nEvaluating model on test set...")
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(
        y_test, y_pred,
        target_names=['Low', 'Medium', 'High'],
        zero_division=0
    )

    if verbose:
        print(f"\nTest Set Accuracy: {accuracy:.4f}")
        print("\nClassification Report:")
        print(report)

        # Confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        print("\nConfusion Matrix:")
        print(cm)

    # Save model artifacts
    if verbose:
        print(f"\nSaving model to {MODEL_PATH}...")
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(label_encoder, LABEL_ENCODER_PATH)

    # Save feature configuration
    feature_config = {
        'feature_names': feature_names,
        'n_features': len(feature_names),
        'trained_on': datetime.now().isoformat(),
        'n_samples': len(df)
    }
    with open(FEATURE_CONFIG_PATH, 'w') as f:
        json.dump(feature_config, f, indent=2)

    # Save model metrics
    metrics = {
        'accuracy': float(accuracy),
        'cv_mean': float(cv_scores.mean()),
        'cv_std': float(cv_scores.std()),
        'cv_scores': [float(s) for s in cv_scores],
        'trained_on': datetime.now().isoformat(),
        'feature_importances': dict(zip(
            feature_names,
            [float(imp) for imp in model.feature_importances_]
        ))
    }
    with open(MODEL_METRICS_PATH, 'w') as f:
        json.dump(metrics, f, indent=2)

    if verbose:
        print("Model and artifacts saved successfully!")

    return model, label_encoder, accuracy, report


def load_model():
    """
    Load the trained model and associated artifacts.

    Returns:
        model: Trained GradientBoostingClassifier
        scaler: Fitted StandardScaler
        label_encoder: Fitted LabelEncoder
        feature_names: List of feature names
    """
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. Please train the model first."
        )

    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    label_encoder = joblib.load(LABEL_ENCODER_PATH)

    with open(FEATURE_CONFIG_PATH, 'r') as f:
        config = json.load(f)
    feature_names = config['feature_names']

    return model, scaler, label_encoder, feature_names


def get_feature_importance(top_n=None):
    """
    Get feature importance rankings from the trained model.

    Args:
        top_n: Number of top features to return (None for all)

    Returns:
        Dictionary with feature names and their importance scores, sorted by importance
    """
    if not os.path.exists(MODEL_METRICS_PATH):
        raise FileNotFoundError("Model metrics not found. Please train the model first.")

    with open(MODEL_METRICS_PATH, 'r') as f:
        metrics = json.load(f)

    importances = metrics['feature_importances']

    # Sort by importance
    sorted_importances = dict(
        sorted(importances.items(), key=lambda x: x[1], reverse=True)
    )

    if top_n:
        sorted_importances = dict(list(sorted_importances.items())[:top_n])

    return sorted_importances


def get_feature_importance_detailed():
    """
    Get detailed feature importance with descriptions and impact analysis.

    Returns:
        List of dictionaries with feature details
    """
    feature_descriptions = {
        'days_since_last_visit': 'Days since patient last visited',
        'no_show_rate': 'Percentage of appointments patient did not attend',
        'total_appointments': 'Total number of appointments scheduled',
        'completed_visits': 'Number of completed visits',
        'satisfaction_score': 'Patient satisfaction rating (1-5)',
        'is_chronic': 'Whether patient has chronic condition',
        'visit_frequency_per_year': 'Average visits per year',
        'completion_rate': 'Percentage of appointments completed',
        'cancelled_rate': 'Percentage of appointments cancelled',
        'engagement_score': 'Combined engagement metric',
        'payment_reliability': 'Payment completion ratio',
        'avg_bill_per_visit': 'Average billing per visit',
        'lifetime_value_normalized': 'Normalized patient lifetime value',
        'age': 'Patient age',
        'age_group': 'Age category (0=Young, 1=Middle, 2=Senior, 3=Elderly)',
        'days_since_registration': 'Days since patient registered',
        'tenure_months': 'Patient tenure in months',
        'recent_no_show': 'Whether last appointment was no-show',
        'high_no_show_risk': 'Flag for high no-show rate',
        'payment_pending_risk': 'Flag for payment issues'
    }

    importances = get_feature_importance()

    results = []
    total_importance = sum(importances.values())

    for i, (feature, importance) in enumerate(importances.items()):
        results.append({
            'rank': i + 1,
            'feature': feature,
            'importance': round(importance, 4),
            'importance_percentage': round(importance / total_importance * 100, 2),
            'description': feature_descriptions.get(feature, 'N/A'),
            'impact': 'High' if importance > 0.1 else ('Medium' if importance > 0.05 else 'Low')
        })

    return results


def extract_patient_features(patient_dict):
    """
    Extract and engineer features from a single patient dictionary.

    Args:
        patient_dict: Dictionary with patient data

    Returns:
        feature_array: Numpy array of engineered features
        feature_dict: Dictionary of feature name to value
    """
    # Create a single-row DataFrame
    df = pd.DataFrame([patient_dict])

    # Engineer features
    feature_df, feature_names = engineer_features(df)
    feature_array = feature_df[feature_names].values[0]

    feature_dict = dict(zip(feature_names, feature_array))

    return feature_array, feature_dict


def predict_score(patient_dict):
    """
    Predict churn risk score (0-100) for a single patient.

    Args:
        patient_dict: Dictionary with patient features

    Returns:
        score: Churn risk score (0-100)
        label: Churn risk label (Low/Medium/High)
    """
    try:
        model, scaler, label_encoder, feature_names = load_model()

        # Extract features
        feature_array, _ = extract_patient_features(patient_dict)

        # Scale features
        feature_scaled = scaler.transform([feature_array])

        # Get probability predictions
        proba = model.predict_proba(feature_scaled)[0]

        # Calculate weighted risk score (0-100)
        # Low=0, Medium=1, High=2 weights
        risk_weights = np.array([0, 50, 100])
        score = float(np.dot(proba, risk_weights))

        # Get predicted label
        pred_class = model.predict(feature_scaled)[0]
        label = label_encoder.inverse_transform([pred_class])[0]

        return score, label

    except FileNotFoundError:
        # Fallback to rule-based scoring if model not trained
        return _rule_based_score(patient_dict)


def _rule_based_score(patient_dict):
    """Fallback rule-based scoring when model is not available."""
    score = 0.0

    # Days since last visit (40% weight)
    days = float(patient_dict.get('days_since_last_visit', 30))
    if days <= 30:
        score += 10
    elif days <= 90:
        score += 35
    else:
        score += min(60, 35 + (days - 90) * 0.1)

    # No-show rate (25% weight)
    no_show = float(patient_dict.get('no_show_rate', 0.1))
    score += no_show * 25

    # Satisfaction score (20% weight)
    satisfaction = float(patient_dict.get('satisfaction_score', 3.0))
    score += (5.0 - satisfaction) / 5.0 * 20

    # Visit frequency (10% weight)
    visit_freq = float(patient_dict.get('visit_frequency_per_year', 2.0))
    if visit_freq < 1:
        score += 10
    elif visit_freq < 2:
        score += 5

    # Chronic condition consideration (5% weight)
    is_chronic = patient_dict.get('is_chronic', 'No')
    if is_chronic == 'Yes' and days > 90:
        score += 5

    # Ensure score is between 0-100
    score = max(0, min(100, score))

    # Determine label
    if score >= 70:
        label = "High"
    elif score >= 40:
        label = "Medium"
    else:
        label = "Low"

    return float(score), str(label)


def predict_batch(patients_df):
    """
    Predict churn risk for multiple patients.

    Args:
        patients_df: DataFrame with patient data

    Returns:
        scores: Array of churn risk scores (0-100)
        labels: Array of churn risk labels
    """
    try:
        model, scaler, label_encoder, feature_names = load_model()

        # Engineer features for all patients
        feature_df, _ = engineer_features(patients_df)
        X = feature_df[feature_names].values

        # Scale features
        X_scaled = scaler.transform(X)

        # Get predictions
        proba = model.predict_proba(X_scaled)
        predictions = model.predict(X_scaled)

        # Calculate scores
        risk_weights = np.array([0, 50, 100])
        scores = np.dot(proba, risk_weights)

        # Get labels
        labels = label_encoder.inverse_transform(predictions)

        return scores, labels

    except FileNotFoundError:
        # Fallback to rule-based
        scores = []
        labels = []
        for _, row in patients_df.iterrows():
            score, label = _rule_based_score(row.to_dict())
            scores.append(score)
            labels.append(label)
        return np.array(scores), np.array(labels)


def get_patient_risk_factors(patient_dict):
    """
    Analyze and return the specific risk factors for a patient.

    Args:
        patient_dict: Dictionary with patient data

    Returns:
        Dictionary with:
            - risk_factors: List of identified risk factors
            - contributing_features: Feature contributions to risk
            - risk_score: Overall risk score
            - risk_label: Risk category
    """
    # Get prediction
    score, label = predict_score(patient_dict)

    # Extract features
    feature_array, feature_dict = extract_patient_features(patient_dict)

    # Get feature importances
    try:
        importances = get_feature_importance()
    except FileNotFoundError:
        importances = {f: 1.0/len(FEATURE_NAMES) for f in FEATURE_NAMES}

    # Analyze risk factors
    risk_factors = []
    contributing_features = []

    # Define thresholds for risk identification
    thresholds = {
        'days_since_last_visit': {'high': 180, 'medium': 90},
        'no_show_rate': {'high': 0.3, 'medium': 0.15},
        'satisfaction_score': {'low': 2.5, 'medium': 3.5},  # Lower is worse
        'visit_frequency_per_year': {'low': 0.5, 'medium': 1.0},
        'completion_rate': {'low': 0.5, 'medium': 0.75},
        'payment_reliability': {'low': 0.5, 'medium': 0.8},
        'engagement_score': {'low': 0.4, 'medium': 0.6},
    }

    # Check each risk factor
    days_since = feature_dict.get('days_since_last_visit', 0)
    if days_since >= thresholds['days_since_last_visit']['high']:
        risk_factors.append({
            'factor': 'Long time since last visit',
            'value': f'{int(days_since)} days',
            'severity': 'high',
            'impact': importances.get('days_since_last_visit', 0.1)
        })
    elif days_since >= thresholds['days_since_last_visit']['medium']:
        risk_factors.append({
            'factor': 'Moderate time since last visit',
            'value': f'{int(days_since)} days',
            'severity': 'medium',
            'impact': importances.get('days_since_last_visit', 0.1)
        })

    no_show_rate = feature_dict.get('no_show_rate', 0)
    if no_show_rate >= thresholds['no_show_rate']['high']:
        risk_factors.append({
            'factor': 'High no-show rate',
            'value': f'{no_show_rate*100:.1f}%',
            'severity': 'high',
            'impact': importances.get('no_show_rate', 0.1)
        })
    elif no_show_rate >= thresholds['no_show_rate']['medium']:
        risk_factors.append({
            'factor': 'Elevated no-show rate',
            'value': f'{no_show_rate*100:.1f}%',
            'severity': 'medium',
            'impact': importances.get('no_show_rate', 0.1)
        })

    satisfaction = feature_dict.get('satisfaction_score', 3.0)
    if satisfaction <= thresholds['satisfaction_score']['low']:
        risk_factors.append({
            'factor': 'Low satisfaction score',
            'value': f'{satisfaction:.1f}/5',
            'severity': 'high',
            'impact': importances.get('satisfaction_score', 0.1)
        })
    elif satisfaction <= thresholds['satisfaction_score']['medium']:
        risk_factors.append({
            'factor': 'Below-average satisfaction',
            'value': f'{satisfaction:.1f}/5',
            'severity': 'medium',
            'impact': importances.get('satisfaction_score', 0.1)
        })

    visit_freq = feature_dict.get('visit_frequency_per_year', 0)
    if visit_freq <= thresholds['visit_frequency_per_year']['low']:
        risk_factors.append({
            'factor': 'Very low visit frequency',
            'value': f'{visit_freq:.2f} visits/year',
            'severity': 'high',
            'impact': importances.get('visit_frequency_per_year', 0.1)
        })
    elif visit_freq <= thresholds['visit_frequency_per_year']['medium']:
        risk_factors.append({
            'factor': 'Low visit frequency',
            'value': f'{visit_freq:.2f} visits/year',
            'severity': 'medium',
            'impact': importances.get('visit_frequency_per_year', 0.1)
        })

    completion_rate = feature_dict.get('completion_rate', 1.0)
    if completion_rate <= thresholds['completion_rate']['low']:
        risk_factors.append({
            'factor': 'Low appointment completion rate',
            'value': f'{completion_rate*100:.1f}%',
            'severity': 'high',
            'impact': importances.get('completion_rate', 0.05)
        })

    payment_rel = feature_dict.get('payment_reliability', 1.0)
    if payment_rel <= thresholds['payment_reliability']['low']:
        risk_factors.append({
            'factor': 'Payment reliability issues',
            'value': f'{payment_rel*100:.1f}%',
            'severity': 'high',
            'impact': importances.get('payment_reliability', 0.05)
        })
    elif payment_rel <= thresholds['payment_reliability']['medium']:
        risk_factors.append({
            'factor': 'Some payment concerns',
            'value': f'{payment_rel*100:.1f}%',
            'severity': 'medium',
            'impact': importances.get('payment_reliability', 0.05)
        })

    # Check chronic patient with irregular visits
    is_chronic = feature_dict.get('is_chronic', 0)
    if is_chronic and visit_freq < 2:
        risk_factors.append({
            'factor': 'Chronic patient with low visit frequency',
            'value': 'Chronic condition, irregular follow-up',
            'severity': 'high',
            'impact': 0.15
        })

    # Sort by impact
    risk_factors = sorted(risk_factors, key=lambda x: x['impact'], reverse=True)

    # Calculate contributing features
    for feature_name, value in feature_dict.items():
        if feature_name in importances:
            contributing_features.append({
                'feature': feature_name,
                'value': round(float(value), 4) if isinstance(value, (int, float)) else value,
                'importance': round(importances.get(feature_name, 0), 4)
            })

    contributing_features = sorted(
        contributing_features,
        key=lambda x: x['importance'],
        reverse=True
    )

    return {
        'risk_score': round(score, 2),
        'risk_label': label,
        'risk_factors': risk_factors,
        'contributing_features': contributing_features[:10],  # Top 10
        'total_risk_factors': len(risk_factors)
    }


def get_patient_recommendations(patient_dict):
    """
    Generate actionable recommendations for a specific patient.

    Args:
        patient_dict: Dictionary with patient data

    Returns:
        Dictionary with:
            - recommendations: List of actionable recommendations
            - priority_actions: Highest priority actions
            - engagement_strategy: Suggested engagement approach
    """
    # Get risk analysis
    risk_analysis = get_patient_risk_factors(patient_dict)
    score = risk_analysis['risk_score']
    label = risk_analysis['risk_label']
    risk_factors = risk_analysis['risk_factors']

    # Extract features
    _, feature_dict = extract_patient_features(patient_dict)

    recommendations = []
    priority_actions = []

    # Map risk factors to recommendations
    for rf in risk_factors:
        factor = rf['factor'].lower()
        severity = rf['severity']

        if 'last visit' in factor:
            rec = RECOMMENDATIONS['high_days_since_visit'].copy()
            rec['severity'] = severity
            rec['specific_value'] = rf['value']
            recommendations.append(rec)
            if severity == 'high':
                priority_actions.append(rec['recommendation'])

        elif 'no-show' in factor:
            rec = RECOMMENDATIONS['high_no_show_rate'].copy()
            rec['severity'] = severity
            rec['specific_value'] = rf['value']
            recommendations.append(rec)
            if severity == 'high':
                priority_actions.append(rec['recommendation'])

        elif 'satisfaction' in factor:
            rec = RECOMMENDATIONS['low_satisfaction'].copy()
            rec['severity'] = severity
            rec['specific_value'] = rf['value']
            recommendations.append(rec)
            if severity == 'high':
                priority_actions.append(rec['recommendation'])

        elif 'visit frequency' in factor:
            rec = RECOMMENDATIONS['low_visit_frequency'].copy()
            rec['severity'] = severity
            rec['specific_value'] = rf['value']
            recommendations.append(rec)

        elif 'payment' in factor:
            rec = RECOMMENDATIONS['payment_issues'].copy()
            rec['severity'] = severity
            rec['specific_value'] = rf['value']
            recommendations.append(rec)

        elif 'chronic' in factor:
            rec = RECOMMENDATIONS['chronic_irregular'].copy()
            rec['severity'] = severity
            rec['specific_value'] = rf['value']
            recommendations.append(rec)
            priority_actions.append(rec['recommendation'])

    # Add age-based recommendations
    age = feature_dict.get('age', 40)
    if age >= 65 and score > 40:
        rec = RECOMMENDATIONS['elderly_at_risk'].copy()
        rec['severity'] = 'high' if score > 60 else 'medium'
        recommendations.append(rec)
        if score > 60:
            priority_actions.append(rec['recommendation'])

    elif age < 35 and feature_dict.get('engagement_score', 1) < 0.5:
        rec = RECOMMENDATIONS['young_disengaged'].copy()
        rec['severity'] = 'medium'
        recommendations.append(rec)

    # High-value patient check
    lifetime_value = feature_dict.get('lifetime_value_normalized', 0)
    if lifetime_value > 0.5 and score > 50:  # High value + elevated risk
        rec = RECOMMENDATIONS['high_value_declining'].copy()
        rec['severity'] = 'critical'
        recommendations.append(rec)
        priority_actions.insert(0, rec['recommendation'])

    # New patient struggling
    tenure = feature_dict.get('tenure_months', 12)
    if tenure < 6 and score > 40:
        rec = RECOMMENDATIONS['new_patient_struggling'].copy()
        rec['severity'] = 'medium' if score < 60 else 'high'
        recommendations.append(rec)

    # Determine engagement strategy
    if label == 'High':
        engagement_strategy = {
            'urgency': 'Immediate',
            'channel': 'Phone call followed by personalized email',
            'frequency': 'Weekly check-ins until engagement improves',
            'assigned_to': 'Senior patient coordinator'
        }
    elif label == 'Medium':
        engagement_strategy = {
            'urgency': 'Within 1 week',
            'channel': 'Email or WhatsApp based on preference',
            'frequency': 'Bi-weekly check-ins',
            'assigned_to': 'Patient engagement team'
        }
    else:
        engagement_strategy = {
            'urgency': 'Standard',
            'channel': 'Automated reminders with personal touch points',
            'frequency': 'Monthly wellness updates',
            'assigned_to': 'Automated system with escalation'
        }

    # Deduplicate recommendations
    seen = set()
    unique_recommendations = []
    for rec in recommendations:
        if rec['factor'] not in seen:
            seen.add(rec['factor'])
            unique_recommendations.append(rec)

    return {
        'patient_id': patient_dict.get('patient_id', 'Unknown'),
        'risk_score': round(score, 2),
        'risk_label': label,
        'recommendations': unique_recommendations,
        'priority_actions': list(set(priority_actions))[:3],  # Top 3 unique
        'engagement_strategy': engagement_strategy,
        'total_recommendations': len(unique_recommendations)
    }


def analyze_patient_complete(patient_dict):
    """
    Complete patient analysis combining risk factors, predictions, and recommendations.

    Args:
        patient_dict: Dictionary with patient data

    Returns:
        Comprehensive analysis dictionary
    """
    risk_analysis = get_patient_risk_factors(patient_dict)
    recommendations = get_patient_recommendations(patient_dict)

    return {
        'patient_id': patient_dict.get('patient_id', 'Unknown'),
        'patient_name': patient_dict.get('full_name',
            f"{patient_dict.get('first_name', '')} {patient_dict.get('last_name', '')}".strip()),
        'analysis_timestamp': datetime.now().isoformat(),
        'risk_assessment': {
            'score': risk_analysis['risk_score'],
            'label': risk_analysis['risk_label'],
            'risk_factors': risk_analysis['risk_factors'],
            'total_risk_factors': risk_analysis['total_risk_factors']
        },
        'feature_analysis': {
            'top_contributing_features': risk_analysis['contributing_features'][:5]
        },
        'action_plan': {
            'recommendations': recommendations['recommendations'],
            'priority_actions': recommendations['priority_actions'],
            'engagement_strategy': recommendations['engagement_strategy']
        },
        'summary': _generate_summary(risk_analysis, recommendations)
    }


def _generate_summary(risk_analysis, recommendations):
    """Generate a human-readable summary of the analysis."""
    score = risk_analysis['risk_score']
    label = risk_analysis['risk_label']
    n_factors = risk_analysis['total_risk_factors']
    n_recs = recommendations['total_recommendations']

    if label == 'High':
        urgency = "requires immediate attention"
    elif label == 'Medium':
        urgency = "needs proactive engagement"
    else:
        urgency = "is stable with standard monitoring"

    summary = f"This patient has a {label} churn risk (score: {score:.0f}/100) and {urgency}. "

    if n_factors > 0:
        high_factors = [rf for rf in risk_analysis['risk_factors'] if rf['severity'] == 'high']
        if high_factors:
            factor_names = [rf['factor'] for rf in high_factors[:2]]
            summary += f"Key concerns include: {', '.join(factor_names)}. "

    if recommendations['priority_actions']:
        summary += f"Priority action: {recommendations['priority_actions'][0]}"

    return summary


# Utility functions for API integration
def get_model_info():
    """Get information about the trained model."""
    if not os.path.exists(MODEL_METRICS_PATH):
        return {'status': 'not_trained', 'message': 'Model has not been trained yet'}

    with open(MODEL_METRICS_PATH, 'r') as f:
        metrics = json.load(f)

    with open(FEATURE_CONFIG_PATH, 'r') as f:
        config = json.load(f)

    return {
        'status': 'trained',
        'accuracy': metrics['accuracy'],
        'cv_mean_accuracy': metrics['cv_mean'],
        'cv_std': metrics['cv_std'],
        'n_features': config['n_features'],
        'feature_names': config['feature_names'],
        'trained_on': metrics['trained_on'],
        'n_samples': config['n_samples']
    }


if __name__ == "__main__":
    # Example usage
    import sys

    csv_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "data",
        "hospital_crm_master.csv"
    )

    if len(sys.argv) > 1 and sys.argv[1] == "train":
        print("=" * 60)
        print("MedRetain CRM - Training Churn Prediction Model")
        print("=" * 60)
        model, le, acc, report = train_model(csv_path)
        print("\n" + "=" * 60)
        print("Training Complete!")
        print("=" * 60)
    else:
        print("Usage: python churn_model.py train")
        print("\nOr import and use the functions:")
        print("  - train_model(csv_path)")
        print("  - predict_score(patient_dict)")
        print("  - get_feature_importance()")
        print("  - get_patient_risk_factors(patient_dict)")
        print("  - get_patient_recommendations(patient_dict)")
        print("  - analyze_patient_complete(patient_dict)")
