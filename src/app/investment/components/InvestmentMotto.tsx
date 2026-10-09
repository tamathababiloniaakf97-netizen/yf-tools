const motto = ['道', '势', '法', '术'] as const;

export default function InvestmentMotto() {
  return (
    <span className="investment-motto" aria-label="道势法术">
      {motto.map((character) => (
        <span className="investment-motto-seal" key={character} aria-hidden="true">
          {character}
        </span>
      ))}
    </span>
  );
}
