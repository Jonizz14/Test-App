import React, { useState } from 'react';
import {
  Modal,
  Tabs,
  Card,
  Typography,
  Button,
  Row,
  Col,
} from 'antd';
import {
  CloseOutlined,
} from '@ant-design/icons';

const MathSymbols = ({ open, onClose, onSymbolSelect }) => {
  const [activeTab, setActiveTab] = useState(0);

  const symbolCategories = [
    {
      label: 'Arifmetik',
      icon: '🔢',
      symbols: [
        { symbol: '+', name: 'Plus' },
        { symbol: '−', name: 'Minus' },
        { symbol: '×', name: 'Ko\'paytirish' },
        { symbol: '÷', name: 'Bo\'lish' },
        { symbol: '=', name: 'Teng' },
        { symbol: '≠', name: 'Teng emas' },
        { symbol: '>', name: 'Katta' },
        { symbol: '<', name: 'Kichik' },
        { symbol: '≥', name: 'Katta yoki teng' },
        { symbol: '≤', name: 'Kichik yoki teng' },
        { symbol: '%', name: 'Foiz' },
        { symbol: '±', name: 'Plus-minus' },
        { symbol: '∓', name: 'Minus-plus' },
      ]
    },
    {
      label: 'Ildizlar',
      icon: '√',
      symbols: [
        { symbol: '√', name: 'Kvadrat ildiz' },
        { symbol: '∛', name: 'Kub ildiz' },
        { symbol: '∜', name: '4-daraja ildiz' },
        { symbol: 'ⁿ√', name: 'n-daraja ildiz' },
        { symbol: '≈', name: 'Taxminan teng' },
      ]
    },
    {
      label: 'Algebra',
      icon: '📐',
      symbols: [
        { symbol: 'x', name: 'O\'zgaruvchi x' },
        { symbol: 'y', name: 'O\'zgaruvchi y' },
        { symbol: 'z', name: 'O\'zgaruvchi z' },
        { symbol: 'a', name: 'O\'zgaruvchi a' },
        { symbol: 'b', name: 'O\'zgaruvchi b' },
        { symbol: 'c', name: 'O\'zgaruvchi c' },
        { symbol: 'n', name: 'O\'zgaruvchi n' },
        { symbol: 'ⁿ', name: 'Daraja n' },
        { symbol: '≡', name: 'Identik tenglik' },
        { symbol: '∝', name: 'Proportsional' },
      ]
    },
    {
      label: 'Kasrlar',
      icon: '➗',
      symbols: [
        { symbol: '½', name: 'Yarim' },
        { symbol: '¼', name: 'Chorak' },
        { symbol: '¾', name: 'Uch chorak' },
        { symbol: '⅓', name: 'Uchdan bir' },
        { symbol: '⅔', name: 'Uchdan ikki' },
        { symbol: '⅕', name: 'Beshdan bir' },
        { symbol: '⅖', name: 'Beshdan ikki' },
        { symbol: '⅗', name: 'Beshdan uch' },
        { symbol: '⅘', name: 'Beshdan to\'rt' },
        { symbol: '⅙', name: 'Oltidan bir' },
        { symbol: '⅚', name: 'Oltidan besh' },
        { symbol: '⅛', name: 'Sakkizdan bir' },
        { symbol: '⅜', name: 'Sakkizdan uch' },
        { symbol: '⅝', name: 'Sakkizdan besh' },
        { symbol: '⅞', name: 'Sakkizdan yetti' },
      ]
    },
    {
      label: 'Tenglamalar',
      icon: '🔁',
      symbols: [
        { symbol: '→', name: 'O\'tish' },
        { symbol: '↔', name: 'Ikkala tomonga' },
        { symbol: '⇒', name: 'Implies' },
        { symbol: '⇔', name: 'Ikkala tomonga tenglik' },
        { symbol: '∴', name: 'Shuning uchun' },
        { symbol: '∵', name: 'Chunki' },
        { symbol: '≈', name: 'Taxminan teng' },
        { symbol: '≅', name: 'Uxshash' },
        { symbol: '~', name: 'Taxminiy' },
      ]
    },
    {
      label: 'To\'plamlar',
      icon: '📊',
      symbols: [
        { symbol: '∈', name: 'A\'zo' },
        { symbol: '∉', name: 'A\'zo emas' },
        { symbol: '⊂', name: 'Kichik to\'plam' },
        { symbol: '⊃', name: 'Kattaroq to\'plam' },
        { symbol: '∪', name: 'Birlashtirish' },
        { symbol: '∩', name: 'Kesishish' },
        { symbol: '∅', name: 'Bo\'sh to\'plam' },
        { symbol: '⊆', name: 'Kichik yoki teng' },
        { symbol: '⊇', name: 'Kattaroq yoki teng' },
      ]
    },
    {
      label: 'Funksiyalar',
      icon: '📘',
      symbols: [
        { symbol: 'f(x)', name: 'Funksiya' },
        { symbol: 'g(x)', name: 'Funksiya g' },
        { symbol: '↗', name: 'O\'suvchi' },
        { symbol: '↘', name: 'Kamayuvchi' },
        { symbol: '∘', name: 'Kompozitsiya' },
        { symbol: 'Δ', name: 'O\'zgarish' },
        { symbol: '∫', name: 'Integral' },
        { symbol: '∑', name: 'Yig\'indi' },
        { symbol: '∏', name: 'Ko\'paytma' },
      ]
    },
    {
      label: 'Geometriya',
      icon: '📐',
      symbols: [
        { symbol: '∠', name: 'Burchak' },
        { symbol: '°', name: 'Gradus' },
        { symbol: 'π', name: 'Pi soni' },
        { symbol: '⊥', name: 'Perpendikulyar' },
        { symbol: '∥', name: 'Parallel' },
        { symbol: '≅', name: 'Kongruent' },
        { symbol: '△', name: 'Uchburchak' },
        { symbol: '○', name: 'Aylana' },
        { symbol: '□', name: 'Kvadrat' },
      ]
    },
    {
      label: 'Mantiq',
      icon: '🧠',
      symbols: [
        { symbol: '∧', name: 'Va' },
        { symbol: '∨', name: 'Yoki' },
        { symbol: '¬', name: 'Inkori' },
        { symbol: '⇒', name: 'Implies' },
        { symbol: '⇔', name: 'Ikkala tomonga' },
        { symbol: '∀', name: 'Har qanday uchun' },
        { symbol: '∃', name: 'Mavjud' },
        { symbol: '∄', name: 'Mavjud emas' },
      ]
    },
    {
      label: 'Ehtimollik',
      icon: '🎲',
      symbols: [
        { symbol: 'P(A)', name: 'Ehtimollik' },
        { symbol: 'σ', name: 'Standart og\'ish' },
        { symbol: 'μ', name: 'O\'rtacha qiymat' },
        { symbol: 'Σ', name: 'Yig\'indi belgisi' },
        { symbol: '∏', name: 'Ko\'paytma belgisi' },
        { symbol: '∞', name: 'Cheksizlik' },
        { symbol: '∂', name: 'Qisman hosila' },
      ]
    },
    {
      label: 'LaTeX',
      icon: '📝',
      symbols: [
        { symbol: '\\frac{a}{b}', name: 'Kasr: a/b' },
        { symbol: 'x^{2}', name: 'Daraja: x²' },
        { symbol: 'x_{2}', name: 'Indeks: x₂' },
        { symbol: '\\sqrt{x}', name: 'Ildiz: √x' },
        { symbol: '\\sqrt[n]{x}', name: 'n-ildiz: ⁿ√x' },
        { symbol: '\\int', name: 'Integral' },
        { symbol: '\\sum', name: 'Yig\'indi ∑' },
        { symbol: '\\prod', name: 'Ko\'paytma ∏' },
        { symbol: '\\lim', name: 'Limit' },
        { symbol: '\\infty', name: 'Cheksizlik ∞' },
        { symbol: '\\alpha', name: 'Alfa α' },
        { symbol: '\\beta', name: 'Beta β' },
        { symbol: '\\gamma', name: 'Gamma γ' },
        { symbol: '\\delta', name: 'Delta δ' },
        { symbol: '\\pi', name: 'Pi π' },
        { symbol: '\\theta', name: 'Teta θ' },
        { symbol: '\\lambda', name: 'Lambda λ' },
        { symbol: '\\mu', name: 'Mu μ' },
        { symbol: '\\sigma', name: 'Sigma σ' },
        { symbol: '\\Delta', name: 'Delta Δ' },
        { symbol: '\\Pi', name: 'Pi Π' },
        { symbol: '\\Sigma', name: 'Sigma Σ' },
        { symbol: '\\leq', name: 'Kichik yoki teng ≤' },
        { symbol: '\\geq', name: 'Katta yoki teng ≥' },
        { symbol: '\\neq', name: 'Teng emas ≠' },
        { symbol: '\\approx', name: 'Taxminan ≈' },
        { symbol: '\\pm', name: 'Plus-minus ±' },
        { symbol: '\\times', name: 'Ko\'paytirish ×' },
        { symbol: '\\div', name: 'Bo\'lish ÷' },
        { symbol: '\\rightarrow', name: 'O\'ngga strelka →' },
        { symbol: '\\leftarrow', name: 'Chapga strelka ←' },
        { symbol: '\\leftrightarrow', name: 'Ikkala tomonga ↔' },
        { symbol: '\\Rightarrow', name: 'Implies ⇒' },
        { symbol: '\\Leftrightarrow', name: 'Ikkala tomonga ⇔' },
      ]
    }
  ];

  const handleSymbolClick = (symbol) => {
    onSymbolSelect(symbol);
  };

  const tabItems = symbolCategories.map((category, index) => ({
    key: index.toString(),
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.2em' }}>{category.icon}</span>
        <span>{category.label}</span>
      </span>
    ),
    children: (
      <div style={{ padding: '16px', height: '400px', overflow: 'auto' }}>
        <Row gutter={[8, 8]}>
          {symbolCategories[index].symbols.map((item, symbolIndex) => (
            <Col xs={12} sm={8} md={6} lg={4} key={symbolIndex}>
              <Card
                size="small"
                hoverable
                style={{
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                }}
                bodyStyle={{ padding: '12px' }}
                onClick={() => handleSymbolClick(item.symbol)}
              >
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 500,
                  marginBottom: '4px',
                  userSelect: 'none'
                }}>
                  {item.symbol}
                </div>
                <div style={{
                  color: '#64748b',
                  fontSize: '0.7rem',
                }}>
                  {item.name}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    ),
  }));

  return (
    <Modal
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography.Text strong style={{ fontSize: '18px' }}>
            🧮 Matematik belgilar
          </Typography.Text>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
      bodyStyle={{ padding: 0 }}
    >
      <Tabs
        activeKey={activeTab.toString()}
        onChange={(key) => setActiveTab(parseInt(key))}
        type="card"
        size="small"
        items={tabItems}
      />
    </Modal>
  );
};

export default MathSymbols;