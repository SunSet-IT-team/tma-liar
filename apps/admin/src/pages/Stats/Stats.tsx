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

interface ActiveUserRow {
  id: string;
  telegramId: string;
  nickname: string;
  profileImg: string | null;
  lastActiveAt: string | null;
  isGuest?: boolean;
}

interface DeckUsageRow {
  deckId: string;
  deckName: string;
  count: number;
}

interface StatsData {
  totalUsers: number;
  activeUsersNow: number;
  activeUsers: ActiveUserRow[];
  totalGames: number;
  totalSubscriptions: number;
  deckUsage: DeckUsageRow[];
}

interface DeckPurchaseItem {
  deckId: string;
  deckName: string;
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
  const [subscriptionData, setSubscriptionData] = useState<{ date: string; count: number }[]>(
    [],
  );
  const [subScale, setSubScale] = useState<TimeScale>('30d');
  const [deckScale, setDeckScale] = useState<TimeScale>('30d');
  const [deckPurchaseEvents, setDeckPurchaseEvents] = useState<
    {
      deckId: string;
      deckName: string;
      telegramId: string;
      purchasedAt: string | null;
      amountRub: number | null;
      paymentMethod: string | null;
    }[]
  >([]);
  const [subscriptionEvents, setSubscriptionEvents] = useState<
    {
      telegramId: string;
      purchasedAt: string | null;
      amountRub: number;
      validUntil: string | null;
    }[]
  >([]);

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

  const loadSubscriptionsByDay = useCallback(async () => {
    const data = await request<{ points: { date: string; count: number }[] }>({
      method: 'GET',
      url: '/api/admin/stats/subscriptions-by-day',
    });
    if (data?.points) setSubscriptionData(data.points);
  }, [request]);

  const loadDeckPurchaseEvents = useCallback(async () => {
    const data = await request<{
      items: {
        deckId: string;
        deckName: string;
        telegramId: string;
        purchasedAt: string | null;
        amountRub: number | null;
        paymentMethod: string | null;
      }[];
    }>({
      method: 'GET',
      url: '/api/admin/stats/deck-purchase-events?limit=200',
    });
    if (data?.items) setDeckPurchaseEvents(data.items);
  }, [request]);

  const loadSubscriptionEvents = useCallback(async () => {
    const data = await request<{
      items: {
        telegramId: string;
        purchasedAt: string | null;
        amountRub: number;
        validUntil: string | null;
      }[];
    }>({
      method: 'GET',
      url: '/api/admin/stats/subscription-events?limit=200',
    });
    if (data?.items) setSubscriptionEvents(data.items);
  }, [request]);

  const loadDeckDetail = useCallback(
    async (deckId: string) => {
      const data = await request<{ deckId: string; perDay: DeckDayPoint[] }>({
        method: 'GET',
        url: `/api/admin/stats/deck-purchases?deckId=${encodeURIComponent(deckId)}`,
      });
      if (data?.perDay) setDeckDayData(data.perDay);
    },
    [request],
  );

  useEffect(() => {
    void loadStats();
    void loadDeckPurchases();
    void loadSubscriptionsByDay();
    void loadDeckPurchaseEvents();
    void loadSubscriptionEvents();
  }, [
    loadStats,
    loadDeckPurchases,
    loadSubscriptionsByDay,
    loadDeckPurchaseEvents,
    loadSubscriptionEvents,
  ]);

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
            void loadSubscriptionsByDay();
            void loadDeckPurchaseEvents();
            void loadSubscriptionEvents();
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
          <span className="stat-value">{stats?.activeUsersNow ?? '—'}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Сыгранных игр</span>
          <span className="stat-value">{stats?.totalGames ?? '—'}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Купленных подписок</span>
          <span className="stat-value">{stats?.totalSubscriptions ?? '—'}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Купленных колод</span>
          <span className="stat-value">{totalDeckPurchases}</span>
        </div>
      </div>

      {/* Active users */}
      <div className="card chart-section">
        <div className="chart-header">
          <h3>Кто на сайте сейчас</h3>
        </div>
        {!stats?.activeUsers?.length ? (
          <div className="chart-empty">
            <p className="muted">Никого нет или клиенты ещё не отправили heartbeat</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ник</th>
                  <th>Тип</th>
                  <th>Telegram ID</th>
                  <th>Активность</th>
                </tr>
              </thead>
              <tbody>
                {stats.activeUsers.map((u) => (
                  <tr key={`${u.isGuest ? 'g' : 'u'}:${u.telegramId}`}>
                    <td>{u.nickname}</td>
                    <td>{u.isGuest ? 'Гость' : 'Пользователь'}</td>
                    <td>
                      <code>{u.telegramId}</code>
                    </td>
                    <td className="muted">
                      {u.lastActiveAt
                        ? new Date(u.lastActiveAt).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deck usage (games started) */}
      <div className="card chart-section">
        <div className="chart-header">
          <h3>Статистика по колодам</h3>
        </div>
        {!stats?.deckUsage?.length ? (
          <div className="chart-empty">
            <p className="muted">Пока нет данных о запущенных играх</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Колода</th>
                  <th>ID</th>
                  <th>Запусков игры</th>
                </tr>
              </thead>
              <tbody>
                {stats.deckUsage.map((row) => (
                  <tr key={row.deckId}>
                    <td>{row.deckName}</td>
                    <td>
                      <code>{row.deckId}</code>
                    </td>
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Subscriptions chart */}
      <div className="card chart-section">
        <div className="chart-header">
          <h3>Покупки подписок по дням</h3>
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

      {/* Лента покупок подписок */}
      <div className="card chart-section">
        <div className="chart-header">
          <h3>Лента покупок подписок</h3>
        </div>
        {!subscriptionEvents.length ? (
          <div className="chart-empty">
            <p className="muted">Пока нет записей</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Telegram ID</th>
                  <th>Оплачено</th>
                  <th>Сумма ₽</th>
                  <th>Действует до</th>
                </tr>
              </thead>
              <tbody>
                {subscriptionEvents.map((row, idx) => (
                  <tr key={`sub-${idx}-${row.telegramId}-${row.purchasedAt ?? ''}`}>
                    <td>
                      <code>{row.telegramId}</code>
                    </td>
                    <td className="muted">
                      {row.purchasedAt
                        ? new Date(row.purchasedAt).toLocaleString()
                        : '—'}
                    </td>
                    <td>{row.amountRub}</td>
                    <td className="muted">
                      {row.validUntil
                        ? new Date(row.validUntil).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Лента покупок колод (аналитика) */}
      <div className="card chart-section">
        <div className="chart-header">
          <h3>Лента покупок колод</h3>
        </div>
        {!deckPurchaseEvents.length ? (
          <div className="chart-empty">
            <p className="muted">Пока нет записей с детализацией</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Колода</th>
                  <th>Telegram ID</th>
                  <th>Время</th>
                  <th>Сумма ₽</th>
                  <th>Способ</th>
                </tr>
              </thead>
              <tbody>
                {deckPurchaseEvents.map((row, idx) => (
                  <tr
                    key={`deck-buy-${idx}-${row.deckId}-${row.telegramId}-${row.purchasedAt ?? ''}`}
                  >
                    <td>
                      {row.deckName}{' '}
                      <code className="muted">{row.deckId}</code>
                    </td>
                    <td>
                      <code>{row.telegramId}</code>
                    </td>
                    <td className="muted">
                      {row.purchasedAt
                        ? new Date(row.purchasedAt).toLocaleString()
                        : '—'}
                    </td>
                    <td>{row.amountRub ?? '—'}</td>
                    <td>{row.paymentMethod ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                <option key={dp.deckId} value={dp.deckId}>
                  {dp.deckName} ({dp.count})
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
                    <th>Колода</th>
                    <th>ID</th>
                    <th>Покупок</th>
                  </tr>
                </thead>
                <tbody>
                  {deckPurchases.map((dp) => (
                    <tr
                      key={dp.deckId}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedDeckId(dp.deckId)}
                    >
                      <td>{dp.deckName}</td>
                      <td>
                        <code>{dp.deckId}</code>
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
