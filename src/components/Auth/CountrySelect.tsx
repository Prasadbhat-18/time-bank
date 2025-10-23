import React from 'react';

const countries = [
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
];

const CountrySelect: React.FC = () => {
  return (
    <div className="country-select">
      <select defaultValue="IN" className="country-select-input">
        {countries.map((c) => (
          <option key={c.code} value={c.code} data-dial={c.dial}>
            {c.flag} {c.name} ({c.dial})
          </option>
        ))}
      </select>
    </div>
  );
};

export default CountrySelect;
