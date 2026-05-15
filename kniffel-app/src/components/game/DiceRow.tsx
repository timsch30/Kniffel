import { Dice } from "@/components/game/Dice";

type DiceRowProps = {
  values?: number[];
  heldDice?: boolean[];
};

export function DiceRow({ heldDice = [], values = [1, 2, 3, 4, 5] }: DiceRowProps) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {values.map((value, index) => (
        <Dice held={heldDice[index]} key={`${value}-${index}`} value={value} />
      ))}
    </div>
  );
}
