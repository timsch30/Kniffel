const rows = [
  ["Einser", "-"],
  ["Zweier", "-"],
  ["Dreier", "-"],
  ["Vierer", "-"],
  ["Fuenfer", "-"],
  ["Sechser", "-"],
  ["Dreierpasch", "-"],
  ["Viererpasch", "-"],
  ["Full House", "-"],
  ["Kleine Strasse", "-"],
  ["Grosse Strasse", "-"],
  ["Kniffel", "-"],
  ["Chance", "-"]
];

export function ScoreTable() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white/90 dark:border-white/10 dark:bg-white/5">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-zinc-300">
          <tr>
            <th className="px-4 py-3 font-semibold">Kategorie</th>
            <th className="px-4 py-3 text-right font-semibold">Punkte</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-white/10">
          {rows.map(([category, score]) => (
            <tr key={category}>
              <td className="px-4 py-3 font-medium text-ink dark:text-zinc-100">{category}</td>
              <td className="px-4 py-3 text-right text-slate-600 dark:text-zinc-400">{score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
