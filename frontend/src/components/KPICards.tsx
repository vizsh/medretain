import React, { useEffect, useState } from 'react';
import { getSummary, AnalyticsSummary } from '../api';

const KPICards: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animatedValues, setAnimatedValues] = useState({
    totalPatients: 0,
    highRisk: 0,
    whatsappEligible: 0,
    avgChurnScore: 0
  });

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await getSummary();
      setSummary(data);
      setError(null);

      // Start animations after data loads
      animateNumbers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  const animateNumbers = (data: AnalyticsSummary) => {
    const duration = 1500; // 1.5 seconds
    const steps = 60; // 60fps
    const stepDuration = duration / steps;

    const targets = {
      totalPatients: data.total_patients,
      highRisk: data.high_risk_count,
      whatsappEligible: data.whatsapp_opt_in_percentage,
      avgChurnScore: data.avg_churn_score
    };

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic

      setAnimatedValues({
        totalPatients: Math.round(targets.totalPatients * easeProgress),
        highRisk: Math.round(targets.highRisk * easeProgress),
        whatsappEligible: targets.whatsappEligible * easeProgress,
        avgChurnScore: targets.avgChurnScore * easeProgress
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        // Set final values to ensure accuracy
        setAnimatedValues({
          totalPatients: targets.totalPatients,
          highRisk: targets.highRisk,
          whatsappEligible: targets.whatsappEligible,
          avgChurnScore: targets.avgChurnScore
        });
      }
    }, stepDuration);

    return () => clearInterval(timer);
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#141921',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              height: '120px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          backgroundColor: '#141921',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          color: '#ff6b6b',
          marginBottom: '32px',
        }}
      >
        Error loading KPIs: {error}
      </div>
    );
  }

  if (!summary) return null;

  const cards = [
    {
      label: 'Total Patients',
      value: animatedValues.totalPatients.toLocaleString(),
      color: '#4cc9f0',
      animate: false,
    },
    {
      label: 'High Risk',
      value: animatedValues.highRisk.toLocaleString(),
      color: '#ff6b6b',
      animate: true,
    },
    {
      label: 'WhatsApp Eligible',
      value: `${animatedValues.whatsappEligible.toFixed(0)}%`,
      color: '#00d4a8',
      animate: false,
    },
    {
      label: 'Avg Churn Score',
      value: animatedValues.avgChurnScore.toFixed(1),
      color: '#ffd166',
      animate: false,
    },
  ];

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          @keyframes cardPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }

          @keyframes numberGlow {
            0%, 100% {
              text-shadow: 0 0 5px currentColor;
              transform: scale(1);
            }
            50% {
              text-shadow: 0 0 15px currentColor, 0 0 25px currentColor;
              transform: scale(1.05);
            }
          }
        `}
      </style>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {cards.map((card, index) => (
          <div
            key={index}
            style={{
              backgroundColor: '#141921',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderLeft: `4px solid ${card.color}`,
              position: 'relative',
              animation: card.animate ? 'cardPulse 2s ease-in-out infinite' : 'none',
              transform: 'translateY(0)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              // Convert hex color to RGB for box-shadow
              const hex = card.color.replace('#', '');
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              e.currentTarget.style.boxShadow = `0 8px 25px rgba(${r}, ${g}, ${b}, 0.3)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '12px',
                fontWeight: 600,
              }}
            >
              {card.label}
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: card.color,
                lineHeight: 1,
                animation: card.animate ? 'numberGlow 2s ease-in-out infinite' : 'none',
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default KPICards;
