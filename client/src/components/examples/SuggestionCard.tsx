import SuggestionCard from '../SuggestionCard';

export default function SuggestionCardExample() {
  return (
    <div className="space-y-4 max-w-md p-4">
      <SuggestionCard
        contact={{
          name: "Sarah Johnson",
          email: "sarah@example.com",
          company: "Tech Ventures",
          title: "Partner"
        }}
        score={3}
        reasons={[
          "Invests in AI infra at seed stage ($1-3M)",
          "Based in SF, matches geo preference",
          "Recently met 45 days ago"
        ]}
        onPromise={() => console.log('Promised')}
        onMaybe={() => console.log('Maybe')}
        onDismiss={() => console.log('Dismissed')}
      />
      <SuggestionCard
        contact={{
          name: "Michael Park",
          email: "michael@example.com",
          company: "DevTools Capital",
          title: "GP"
        }}
        score={2}
        reasons={[
          "DevTools investor at Series A",
          "Strong relationship (0.8 score)",
        ]}
        onPromise={() => console.log('Promised')}
        onMaybe={() => console.log('Maybe')}
        onDismiss={() => console.log('Dismissed')}
      />
    </div>
  );
}
