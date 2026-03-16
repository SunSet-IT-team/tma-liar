import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import { PageHeader } from '../../components/PageHeader';
import { StatusMessage } from '../../components/StatusMessage';
import { Modal } from '../../components/Modal';
import './Users.css';

interface User {
  id: string;
  nickname: string;
  telegramId: string;
  profileImg?: string;
}

export function UsersPage() {
  const { request, loading, error } = useApi();
  const [users, setUsers] = useState<User[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchId, setSearchId] = useState('');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editNickname, setEditNickname] = useState('');

  const loadAllUsers = useCallback(async () => {
    setSuccess(null);
    const data = await request<User[]>({
      method: 'GET',
      url: '/api/admin/users',
    });
    if (data) setUsers(data);
  }, [request]);

  useEffect(() => {
    void loadAllUsers();
  }, [loadAllUsers]);

  const handleSearch = async () => {
    if (!searchId.trim()) {
      await loadAllUsers();
      return;
    }
    setSuccess(null);
    const data = await request<User>({
      method: 'GET',
      url: `/api/admin/users/${searchId.trim()}`,
    });
    if (data) {
      setUsers([data]);
      setSuccess('Пользователь найден');
    }
  };

  const handleDelete = async (telegramId: string) => {
    if (!confirm(`Удалить пользователя ${telegramId}?`)) return;
    const data = await request<User>({
      method: 'DELETE',
      url: `/api/admin/users/${telegramId}`,
    });
    if (data) {
      setSuccess(`Пользователь ${telegramId} удалён`);
      setUsers((prev) => prev.filter((u) => u.telegramId !== telegramId));
    }
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditNickname(user.nickname);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    const data = await request<User>({
      method: 'PUT',
      url: `/api/admin/users/${editUser.telegramId}`,
      data: { nickname: editNickname },
    });
    if (data) {
      setSuccess(`Пользователь ${editUser.telegramId} обновлён`);
      setEditUser(null);
      await loadAllUsers();
    }
  };

  return (
    <div>
      <PageHeader title="Пользователи">
        <button onClick={loadAllUsers} disabled={loading}>
          {loading ? 'Загрузка...' : 'Обновить'}
        </button>
      </PageHeader>

      <StatusMessage error={error} success={success} />

      <div className="search-bar">
        <input
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          placeholder="Telegram ID для поиска..."
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          Найти
        </button>
        {searchId && (
          <button
            className="secondary"
            onClick={() => {
              setSearchId('');
              void loadAllUsers();
            }}
          >
            Сбросить
          </button>
        )}
      </div>

      <div className="card">
        {users.length === 0 && !loading ? (
          <p className="muted">Нет пользователей</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Аватар</th>
                <th>Никнейм</th>
                <th>Telegram ID</th>
                <th>ID</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id || user.telegramId}>
                  <td>
                    {user.profileImg ? (
                      <img
                        src={user.profileImg}
                        alt=""
                        className="user-avatar"
                      />
                    ) : (
                      <div className="user-avatar-placeholder">
                        {user.nickname.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td>{user.nickname}</td>
                  <td>
                    <code>{user.telegramId}</code>
                  </td>
                  <td>
                    <code className="muted">{user.id?.slice(0, 10)}...</code>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        className="secondary"
                        onClick={() => openEdit(user)}
                      >
                        Изменить
                      </button>
                      <button
                        className="danger"
                        onClick={() => handleDelete(user.telegramId)}
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

      <Modal
        open={editUser !== null}
        onClose={() => setEditUser(null)}
        title={`Редактирование: ${editUser?.nickname ?? ''}`}
      >
        <div className="form-group">
          <label>Telegram ID</label>
          <input value={editUser?.telegramId ?? ''} disabled />
        </div>
        <div className="form-group">
          <label>Никнейм</label>
          <input
            value={editNickname}
            onChange={(e) => setEditNickname(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="secondary" onClick={() => setEditUser(null)}>
            Отмена
          </button>
          <button onClick={handleSaveEdit} disabled={loading}>
            Сохранить
          </button>
        </div>
      </Modal>
    </div>
  );
}
