import { TAG_COLORS } from "../constants";
import { TagColor } from "../types";

interface TagProps {
  value: string;
  color: TagColor;
}

export function Tag({ value, color }: TagProps) {
  const colors = TAG_COLORS[color];
  return (
    <span
      className="csv-db-tag"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {value}
    </span>
  );
}
