import { useQuery } from '@tanstack/react-query'
import { fetchEditalTopics } from '../api/client'

const CUSTOM = '__custom__'

/**
 * Seletor de tópico alimentado pelo edital.
 *
 * Escolha a disciplina → a lista mostra só os subtópicos dela, já no formato
 * "código título" que o resto da plataforma usa. Se nenhum subtópico servir,
 * há a opção de digitar um personalizado — mas o padrão é não digitar nada.
 */
export default function TopicSelect({
  subjectName,
  value,
  onChange,
  required = true,
  disabled = false,
}: {
  subjectName?: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  disabled?: boolean
}) {
  const { data: groups } = useQuery({ queryKey: ['edital-topics'], queryFn: fetchEditalTopics })

  const group = groups?.find((g) => g.subject === subjectName)
  const options = group?.topics ?? []
  const isCustom = value !== '' && !options.some((o) => o.value === value)

  return (
    <>
      <select
        value={isCustom ? CUSTOM : value}
        onChange={(e) => {
          if (e.target.value === CUSTOM) onChange('')
          else onChange(e.target.value)
        }}
        required={required && !isCustom}
        disabled={disabled}
        className="input"
      >
        <option value="">
          {options.length === 0 ? 'Selecione a disciplina primeiro' : 'Selecione o tópico...'}
        </option>
        {options.map((t) => (
          <option key={t.value} value={t.value}>{t.value}</option>
        ))}
        <option value={CUSTOM}>✏️ Outro (digitar)</option>
      </select>

      {isCustom && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder="digite o tópico"
          className="input mt-2"
        />
      )}
    </>
  )
}