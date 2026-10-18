import Calculator from '../components/Calculator';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'SIP Smart';

export default function Home() {
  return (
    <>
      <header>
        <div className="brand">{APP_NAME}</div>
        <h1>Plan Your Financial Future with Confidence.</h1>
        <p>Calculate SIP returns, compare investment strategies, and build a smarter plan for your financial goals.</p>
      </header>
      <Calculator />
      <footer>
        <p className="note"><b>Disclaimer:</b> These calculations are illustrative estimates based on user-selected assumptions. Actual investment returns may vary, and market-linked investments can lose value. This tool does not guarantee returns or constitute personalized financial advice.</p>
        <p className="note"><b>Conventions:</b> Annual rate R is an effective annual return; monthly r = (1+R)^(1/12) − 1. “End” = contributions at period end (ordinary annuity); “Beginning” = annuity due. Step-up SIPs use an explicit monthly cash-flow schedule. Calculations run in your browser; nothing is stored or sent.</p>
      </footer>
    </>
  );
}
