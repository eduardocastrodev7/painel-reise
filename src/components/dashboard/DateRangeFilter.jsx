// src/components/dashboard/DateRangeFilter.jsx

function toInputValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodaySaoPauloDate() {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  return new Date(`${ymd}T00:00:00`);
}

function addDays(date, delta) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

function firstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function DateRangeFilter({
  minDate,
  maxDate,
  startDate,
  endDate,
  onChange,
}) {
  const minStr = minDate ? toInputValue(minDate) : undefined;
  const maxStr = maxDate ? toInputValue(maxDate) : undefined;

  const emitChange = (nextStart, nextEnd) => {
    if (!onChange) return;
    onChange({
      startDate: nextStart,
      endDate: nextEnd,
      start: nextStart,
      end: nextEnd,
    });
  };

  const handleStartChange = (e) => {
    const value = e.target.value;
    const date = value ? new Date(`${value}T00:00:00`) : null;

    let nextStart = date;
    let nextEnd = endDate || date;

    if (!nextStart && nextEnd) nextStart = nextEnd;
    if (nextStart && !nextEnd) nextEnd = nextStart;

    emitChange(nextStart, nextEnd);
  };

  const handleEndChange = (e) => {
    const value = e.target.value;
    const date = value ? new Date(`${value}T00:00:00`) : null;

    let nextStart = startDate || date;
    let nextEnd = date;

    if (!nextStart && nextEnd) nextStart = nextEnd;
    if (nextStart && !nextEnd) nextEnd = nextStart;

    emitChange(nextStart, nextEnd);
  };

  const today = getTodaySaoPauloDate();
  const presets = [
    { id: 'today', label: 'Hoje', start: today, end: today },
    { id: 'yesterday', label: 'Ontem', start: addDays(today, -1), end: addDays(today, -1) },
    { id: '7d', label: '7d', start: addDays(today, -6), end: today },
    { id: '30d', label: '30d', start: addDays(today, -29), end: today },
    { id: 'mtd', label: 'MTD', start: firstDayOfMonth(today), end: today },
  ];

  const startStr = startDate ? toInputValue(startDate) : '';
  const endStr = endDate ? toInputValue(endDate) : '';

  const isPresetActive = (p) =>
    toInputValue(p.start) === startStr && toInputValue(p.end) === endStr;

  return (
    <section className="panel filters-panel">
      <div className="filters-left">
        <span className="filters-label">Período</span>
        <p className="filters-description">
          Selecione o intervalo. Pra ver só 1 dia, escolha a mesma data em Início e Fim.
        </p>

        <div className="period-pills">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              className={'period-pill' + (isPresetActive(p) ? ' period-pill--active' : '')}
              onClick={() => emitChange(p.start, p.end)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filters-right">
        <div className="filters-input-group">
          <div className="filters-input">
            <span className="filters-input-label">Início</span>
            <input
              type="date"
              min={minStr}
              max={maxStr}
              value={startDate ? toInputValue(startDate) : ''}
              onChange={handleStartChange}
            />
          </div>

          <div className="filters-input">
            <span className="filters-input-label">Fim</span>
            <input
              type="date"
              min={minStr}
              max={maxStr}
              value={endDate ? toInputValue(endDate) : ''}
              onChange={handleEndChange}
            />
          </div>
        </div>
      </div>
    </section>
  );
}