"""
Standalone script to train the churn prediction model.
Run this script to train the model on the hospital CRM data.

Usage:
    python train.py           # Train with default settings
    python train.py --test    # Train and run tests
"""
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.churn_model import (
    train_model,
    get_feature_importance,
    get_feature_importance_detailed,
    get_patient_risk_factors,
    get_patient_recommendations,
    analyze_patient_complete,
    predict_score,
    get_model_info
)
import pandas as pd


def main():
    """Main function to train and optionally test the model."""
    # Path to CSV file
    csv_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "data",
        "hospital_crm_master.csv"
    )

    if not os.path.exists(csv_path):
        print(f"ERROR: CSV file not found at {csv_path}")
        print("Please ensure data/hospital_crm_master.csv exists")
        return

    print("=" * 70)
    print("MedRetain CRM - Comprehensive Churn Prediction Model Training")
    print("=" * 70)
    print()

    # Train the model
    model, label_encoder, accuracy, report = train_model(csv_path)

    print("\n" + "=" * 70)
    print("Training completed successfully!")
    print("=" * 70)

    # Display feature importance
    print("\n\nTOP 10 FEATURE IMPORTANCE:")
    print("-" * 50)
    importances = get_feature_importance(top_n=10)
    for i, (feature, importance) in enumerate(importances.items(), 1):
        bar = "=" * int(importance * 100)
        print(f"{i:2}. {feature:30} {importance:.4f} {bar}")

    # If --test flag is provided, run additional tests
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        run_tests(csv_path)

    print("\n" + "=" * 70)
    print("Model artifacts saved to: backend/ml/")
    print("  - churn_model.pkl        (trained model)")
    print("  - scaler.pkl             (feature scaler)")
    print("  - label_encoder.pkl      (label encoder)")
    print("  - feature_config.json    (feature configuration)")
    print("  - model_metrics.json     (model metrics)")
    print("=" * 70)


def run_tests(csv_path):
    """Run tests on the trained model."""
    print("\n\n" + "=" * 70)
    print("RUNNING MODEL TESTS")
    print("=" * 70)

    # Load sample data
    df = pd.read_csv(csv_path)

    # Test 1: Feature importance
    print("\n\n1. DETAILED FEATURE IMPORTANCE:")
    print("-" * 50)
    detailed_importance = get_feature_importance_detailed()
    for item in detailed_importance[:5]:
        print(f"   Rank {item['rank']}: {item['feature']}")
        print(f"      Importance: {item['importance']} ({item['importance_percentage']}%)")
        print(f"      Impact: {item['impact']}")
        print(f"      Description: {item['description']}")
        print()

    # Test 2: Sample patient predictions
    print("\n2. SAMPLE PATIENT PREDICTIONS:")
    print("-" * 50)

    # Get a few sample patients
    sample_patients = df.sample(n=3, random_state=42)

    for idx, row in sample_patients.iterrows():
        patient_dict = row.to_dict()
        score, label = predict_score(patient_dict)
        print(f"\n   Patient: {patient_dict.get('full_name', 'Unknown')}")
        print(f"   Risk Score: {score:.1f}/100")
        print(f"   Risk Label: {label}")

    # Test 3: Full patient analysis
    print("\n\n3. COMPLETE PATIENT ANALYSIS (Sample):")
    print("-" * 50)

    # Get a high-risk patient
    high_risk_patients = df[df['churn_risk_label'] == 'High']
    if len(high_risk_patients) > 0:
        sample = high_risk_patients.iloc[0].to_dict()
        analysis = analyze_patient_complete(sample)

        print(f"\n   Patient: {analysis['patient_name']}")
        print(f"   Risk Score: {analysis['risk_assessment']['score']}/100")
        print(f"   Risk Label: {analysis['risk_assessment']['label']}")

        print("\n   Risk Factors:")
        for rf in analysis['risk_assessment']['risk_factors'][:3]:
            print(f"      - {rf['factor']}: {rf['value']} (Severity: {rf['severity']})")

        print("\n   Priority Actions:")
        for action in analysis['action_plan']['priority_actions'][:3]:
            print(f"      - {action}")

        print("\n   Engagement Strategy:")
        strategy = analysis['action_plan']['engagement_strategy']
        print(f"      Urgency: {strategy['urgency']}")
        print(f"      Channel: {strategy['channel']}")

        print(f"\n   Summary: {analysis['summary']}")

    # Test 4: Model info
    print("\n\n4. MODEL INFORMATION:")
    print("-" * 50)
    info = get_model_info()
    print(f"   Status: {info['status']}")
    print(f"   Accuracy: {info['accuracy']:.4f}")
    print(f"   CV Mean Accuracy: {info['cv_mean_accuracy']:.4f} (+/- {info['cv_std']:.4f})")
    print(f"   Number of Features: {info['n_features']}")
    print(f"   Training Samples: {info['n_samples']}")
    print(f"   Trained On: {info['trained_on']}")

    print("\n\nAll tests completed successfully!")


if __name__ == "__main__":
    main()
