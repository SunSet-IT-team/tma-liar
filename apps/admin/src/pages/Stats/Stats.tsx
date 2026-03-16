import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useApi } from '../../hooks/useApi';
import { PageHeader } from '../../components/PageHeader';
import { StatusMessage } from '../../components/StatusMessage';
import './Stats.css';

interface StatsData {
  totalUsers: number;
  activeUsersNow: number;
  totalGames: number;
  totalSubscriptions: number;
}

interface DeckPurchaseItem {
  _id: string;
  count: number;
}

interface DeckDayPoint {
  _id: string;
  count: number;
}

type TimeScale = '7d' | '30d' | '90d' | 'all';

export function StatsPage() {
  const { request, loading, error } = useApi();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [deckPurchases, setDeckPurchases] = useState<DeckPurchaseItem[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [deckDayData, setDeckDayData] = useState<DeckDayPoint[]>([]);
  const [subscriptionData] = useState<{ date: string; count: number }[]>([]);
  const [subScale, setSubScale] = useState<TimeScale>('30d');
  const [deckScale, setDeckScale] = useState<TimeScale>('30d');

  const loadStats = useCallback(async () => {
    const data = await request<StatsData>({
      method: 'GET',
      url: '/api/admin/stats',
    });
    if (data) setStats(data);
  }, [request]);

  const loadDeckPurchases = useCallback(async () => {
    const data = await request<{ items: DeckPurchaseItem[] }>({
      method: 'GET',
      url: '/api/admin/stats/deck-purchases',
    });
    if (data?.items) setDeckPurchases(data.items);
  }, [request]);

  const loadDeckDetail = useCallback(
    async (deckId: string) => {
      const data = await request<{ deckId: string; perDay: DeckDayPoint[] }>({
        method: 'GET',
        url: `/api/admin/stats/deck-purchases?deckId=${deckId}`,
      });
      if (data?.perDay) setDeckDayData(data.perDay);
    },
    [request],
  );

  useEffect(() => {
    void loadStats();
    void loadDeckPurchases();
  }, [loadStats, loadDeckPurchases]);

  useEffect(() => {
    if (selectedDeckId) {
      void loadDeckDetail(selectedDeckId);
    } else {
      setDeckDayData([]);
    }
  }, [selectedDeckId, loadDeckDetail]);

  const filterByScale = <T extends { _id?: string; date?: string }>(
    data: T[],
    scale: TimeScale,
  ): T[] => {
    if (scale === 'all') return data;
    const now = Date.now();
    const days = scale === '7d' ? 7 : scale === '30d' ? 30 : 90;
    const cutoff = new Date(now - days * 86400000)
      .toISOString()
      .split('T')[0];
    return data.filter((d) => (d._id ?? d.date ?? '') >= cutoff);
  };

  const totalDeckPurchases = deckPurchases.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  const scaleButtons = (
    current: TimeScale,
    onChange: (s: TimeScale) => void,
  ) => (
    <div className="scale-buttons">
      {(['7d', '30d', '90d', 'all'] as TimeScale[]).map((s) => (
        <button
          key={s}
          className={current === s ? '' : 'secondary'}
          onClick={() => onChange(s)}
        >
          {s === 'all' ? 'Все' : s}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader title="Статистика">
        <button
          onClick={() => {
            void loadStats();
            void loadDeckPurchases();
          }}
          disabled={loading}
        >
          {loading ? 'Загрузка...' : 'Обновить'}
        </button>
      </PageHeader>

      <StatusMessage error={error} />

      {/* KPI cards */}
      <div className="stats-grid">
        <div className="card stat-card">
          <span className="stat-label">Пользователей</span>
          <span className="stat-value">{stats?.totalUsers ?? '—'}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Активных сейчас</span>
          <span className="stat-value stub">
            {stats?.activeUsersNow ?? '—'}
            <small className="stub-badge">заглушка</small>
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Сыгранных игр</span>
          <span className="stat-value stub">
            {stats?.totalGames ?? '—'}
            <small className="stub-badge">заглушка</small>
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Купленных подписок</span>
          <span className="stat-value stub">
            {stats?.totalSubscriptions ?? 0}
            <small className="stub-badge">заглушка</small>
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Купленных колод</span>
          <span className="stat-value">{totalDeckPurchases}</span>
        </div>
      </div>

      {/* Subscriptions chart (stub) */}
      <div className="card chart-section">
        <div className="chart-header">
          <h3>
            Покупки подписок по дням
            <small className="stub-badge">заглушка</small>
          </h3>
          {scaleButtons(subScale, setSubScale)}
        </div>
        {subscriptionData.length === 0 ? (
          <div className="chart-empty">
            <p className="muted">Нет данных о подписках</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={filterByScale(subscriptionData, subScale)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d38" />
              <XAxis dataKey="date" stroke="#8b8d97" fontSize={12} />
              <YAxis stroke="#8b8d97" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: '#181a20',
                  border: '1px solid #2a2d38',
                  borderRadius: 8,
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#5b5eea"
                fill="rgba(91,94,234,0.2)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Deck purchases chart */}
      <div className="card chart-section">
        <div className="chart-header">
          <h3>Покупки колод по дням</h3>
          <div className="chart-controls">
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
            >
              <option value="">Все колоды</option>
              {deckPurchases.map((dp) => (
                <option key={dp._id} value={dp._id}>
                  {dp._id} ({dp.count})
                </option>
              ))}
            </select>
            {scaleButtons(deckScale, setDeckScale)}
          </div>
        </div>

        {!selectedDeckId ? (
          <div className="chart-empty">
            <p className="muted">
              Выберите колоду для отображения графика покупок по дням
            </p>
            {deckPurchases.length > 0 && (
              <table style={{ marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>Deck ID</th>
                    <th>Покупок</th>
                  </tr>
                </thead>
                <tbody>
                  {deckPurchases.map((dp) => (
                    <tr
                      key={dp._id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedDeckId(dp._id)}
                    >
                      <td>
                        <code>{dp._id}</code>
                      </td>
                      <td>{dp.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : deckDayData.length === 0 ? (
          <div className="chart-empty">
            <p className="muted">Нет данных за выбранный период</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              data={filterByScale(deckDayData, deckScale).map((d) => ({
                date: d._id,
                count: d.count,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d38" />
              <XAxis dataKey="date" stroke="#8b8d97" fontSize={12} />
              <YAxis stroke="#8b8d97" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: '#181a20',
                  border: '1px solid #2a2d38',
                  borderRadius: 8,
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#34c77b"
                fill="rgba(52,199,123,0.2)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
