import { View } from 'react-native';
import { Chip, Text } from '@/components/ui';
import { space } from '@/constants/brand';
import { INTEREST_OPTIONS, MAX_INTERESTS } from '@/lib/profileOptions';

/** Pick up to eight things you enjoy outside work. They help colleagues find common ground. */
export function InterestPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const full = value.length >= MAX_INTERESTS;
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : full ? value : [...value, id]);
  return (
    <View style={{ marginBottom: space.lg }}>
      <Text variant="h3" style={{ marginBottom: space.xs }}>Your interests (optional)</Text>
      <Text variant="small" style={{ marginBottom: space.sm }}>
        Pick up to {MAX_INTERESTS} ({value.length} chosen). Colleagues who choose to be found can see these.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {INTEREST_OPTIONS.map((i) => (
          <Chip key={i.id} label={i.label} selected={value.includes(i.id)} onPress={() => toggle(i.id)} disabled={full && !value.includes(i.id)} />
        ))}
      </View>
    </View>
  );
}
