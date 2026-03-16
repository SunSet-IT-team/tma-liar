import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import { PageHeader } from '../../components/PageHeader';
import { StatusMessage } from '../../components/StatusMessage';
import { Modal } from '../../components/Modal';
import './Lobbies.css';

interface Player {
  id: string;
  telegramId: string;
  nickname: string;
  profileImg?: string;
  score: number;
  isReady: boolean;
  inGame: boolean;
}

interface Lobby {
  id?: string;
  lobbyCode: string;
  adminId: string;
  currentGameId: string | null;
  status: string;
  players: Player[];
  settings: Record<string, unknown>;
}

export function LobbiesPage() {
  const { request, loading, error } = useApi();
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [editLobby, setEditLobby] = useState<Lobby | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [detailLobby, setDetailLobby] = useState<Lobby | null>(null);

  const loadLobbies = useCallback(async () => {
    setSuccess(null);
    const data = await request<Lobby[]>({ method: 'GET', url: '/api/admin/lobbies' });
    if (data) setLobbies(data);
  }, [request]);

  useEffect(() => {
    void loadLobbies();
  }, [loadLobbies]);

  const handleDelete = async (lobbyCode: string) => {
    if (!confirm(`Удалить лобби ${lobbyCode}?`)) return;
    const data = await request<Lobby>({
      method: 'DELETE',
      url: `/api/admin/lobbies/${lobbyCode}`,
    });
    if (data) {
      setSuccess(`Лобби ${lobbyCode} удалено`);
      setLobbies((prev) => prev.filter((l) => l.lobbyCode !== lobbyCode));
    }
  };

  const handleSaveEdit = async () => {
    if (!editLobby) return;
    const data = await request<Lobby>({
      method: 'PUT',
      url: '/api/admin/lobbies',
      data: { lobbyCode: editLobby.lobbyCode, status: editStatus },
    });
    if (data) {
      setSuccess(`Лобби ${editLobby.lobbyCode} обновлено`);
      setEditLobby(null);
      await loadLobbies();
    }
  };

  const openEdit = (lobby: Lobby) => {
    setEditLobby(lobby);
    setEditStatus(lobby.status);
  };

  const statusBadge = (status: string) => {
    const cls =
      status === 'waiting'
        ? 'waiting'
        : status === 'started'
          ? 'started'
          : 'finished';
    return <span className={`badge ${cls}`}>{status}</span>;
  };

  return (
    <div>
      <PageHeader title="Лобби">
        <button onClick={loadLobbies} disabled={loading}>
          {loading ? 'Загрузка...' : 'Обновить'}
        </button>
      </PageHeader>

      <StatusMessage error={error} success={success} />

      <div className="card">
        {lobbies.length === 0 && !loading ? (
          <p className="muted">Нет лобби</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Код</th>
                <th>Статус</th>
                <th>Игроки</th>
                <th>Админ</th>
                <th>Игра</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {lobbies.map((lobby) => (
                <tr key={lobby.lobbyCode}>
                  <td>
                    <code>{lobby.lobbyCode}</code>
                  </td>
                  <td>{statusBadge(lobby.status)}</td>
                  <td>{lobby.players.length}</td>
                  <td>
                    <span className="muted">{lobby.adminId}</span>
                  </td>
                  <td>
                    {lobby.currentGameId ? (
                      <code>{lobby.currentGameId.slice(0, 8)}...</code>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        className="secondary"
                        onClick={() => setDetailLobby(lobby)}
                      >
                        Детали
                      </button>
                      <button
                        className="secondary"
                        onClick={() => openEdit(lobby)}
                      >
                        Изменить
                      </button>
                      <button
                        className="danger"
                        onClick={() => handleDelete(lobby.lobbyCode)}
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit modal */}
      <Modal
        open={editLobby !== null}
        onClose={() => setEditLobby(null)}
        title={`Редактирование: ${editLobby?.lobbyCode ?? ''}`}
      >
        <div className="form-group">
          <label>Статус</label>
          <select
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
          >
            <option value="waiting">waiting</option>
            <option value="started">started</option>
            <option value="finished">finished</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="secondary" onClick={() => setEditLobby(null)}>
            Отмена
          </button>
          <button onClick={handleSaveEdit} disabled={loading}>
            Сохранить
          </button>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal
        open={detailLobby !== null}
        onClose={() => setDetailLobby(null)}
        title={`Лобби: ${detailLobby?.lobbyCode ?? ''}`}
      >
        {detailLobby && (
          <div className="lobby-detail">
            <div className="detail-row">
              <span className="muted">Код:</span>
              <code>{detailLobby.lobbyCode}</code>
            </div>
            <div className="detail-row">
              <span className="muted">Статус:</span>
              {statusBadge(detailLobby.status)}
            </div>
            <div className="detail-row">
              <span className="muted">Админ:</span>
              <span>{detailLobby.adminId}</span>
            </div>
            <div className="detail-row">
              <span className="muted">Текущая игра:</span>
              <span>{detailLobby.currentGameId ?? '—'}</span>
            </div>

            <h3 style={{ marginTop: 12 }}>
              Игроки ({detailLobby.players.length})
            </h3>
            <table>
              <thead>
                <tr>
                  <th>Никнейм</th>
                  <th>Telegram ID</th>
                  <th>Очки</th>
                  <th>Готов</th>
                  <th>В игре</th>
                </tr>
              </thead>
              <tbody>
                {detailLobby.players.map((p) => (
                  <tr key={p.id || p.telegramId}>
                    <td>{p.nickname}</td>
                    <td>
                      <code>{p.telegramId}</code>
                    </td>
                    <td>{p.score}</td>
                    <td>{p.isReady ? '✓' : '—'}</td>
                    <td>{p.inGame ? '✓' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ marginTop: 12 }}>Настройки</h3>
            <pre className="detail-json">
              {JSON.stringify(detailLobby.settings, null, 2)}
            </pre>
          </div>
        )}
      </Modal>
    </div>
  );
}
