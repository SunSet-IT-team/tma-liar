import axios from 'axios';
import { useMemo, useState } from 'react';

type DeckQuestion = {
  id: string;
  type: string;
  content: string;
  complexity: number;
};

type Deck = {
  id: string;
  name: string;
  description?: string;
  ageLimit?: number;
  categories?: string[];
  questionsCount: number;
  cover: string;
  isPaid?: boolean;
  priceRub?: number;
  questions: DeckQuestion[];
};

type DeckDraft = {
  name: string;
  description: string;
  ageLimit: number;
  categories: string[];
  cover: string;
  priceRub: number;
  questions: DeckQuestion[];
};

type ApiEnvelope<T> = {
  status: 'success' | 'error';
  payload: T;
};

const TOKEN_KEY = 'deck_editor_admin_token';

const createQuestionId = (): string =>
  `q_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

const createQuestion = (): DeckQuestion => ({
  id: createQuestionId(),
  type: 'text',
  content: '',
  complexity: 1,
});

const defaultDraft: DeckDraft = {
  name: '',
  description: '',
  ageLimit: 0,
  categories: [],
  cover: '',
  priceRub: 0,
  questions: [createQuestion()],
};

function readError(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'Неизвестная ошибка';
  }

  const errorCode = (error.response?.data as { errorCode?: string } | undefined)?.errorCode;
  return errorCode ?? error.message;
}

export function App() {
  const [tokenInput, setTokenInput] = useState<string>(localStorage.getItem(TOKEN_KEY) ?? '');
  const [token, setToken] = useState<string>(localStorage.getItem(TOKEN_KEY) ?? '');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DeckDraft>(defaultDraft);
  const [categoryInput, setCategoryInput] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [statusType, setStatusType] = useState<'ok' | 'error'>('ok');
  const [loadingDecks, setLoadingDecks] = useState<boolean>(false);
  const [uploadingCover, setUploadingCover] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const api = useMemo(
    () =>
      axios.create({
        baseURL: '',
        headers: token
          ? {
              'x-admin-token': token,
            }
          : undefined,
      }),
    [token],
  );

  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) ?? null;

  const setSuccess = (message: string) => {
    setStatusType('ok');
    setStatus(message);
  };

  const setFailure = (message: string) => {
    setStatusType('error');
    setStatus(message);
  };

  const mapDeckToDraft = (deck: Deck) => {
    const normalizedQuestions = deck.questions.length > 0 ? deck.questions : [createQuestion()];
    setDraft({
      name: deck.name,
      description: deck.description ?? '',
      ageLimit: deck.ageLimit ?? 0,
      categories: deck.categories ?? [],
      cover: deck.cover,
      priceRub: deck.priceRub ?? 0,
      questions: normalizedQuestions,
    });
  };

  const resetToNewDeck = () => {
    setSelectedDeckId(null);
    setDraft(defaultDraft);
    setCategoryInput('');
  };

  const loadDecks = async () => {
    if (!token) {
      setFailure('Сначала укажи admin token');
      return;
    }

    setLoadingDecks(true);
    setStatus('');
    try {
      const response = await api.get<ApiEnvelope<Deck[]>>('/api/admin/decks');
      const list = response.data.payload;
      setDecks(list);

      if (list.length === 0) {
        resetToNewDeck();
        setSuccess('Колод пока нет');
        return;
      }

      const stillSelected = selectedDeckId ? list.find((item) => item.id === selectedDeckId) : null;
      const next = stillSelected ?? list[0];
      setSelectedDeckId(next.id);
      mapDeckToDraft(next);
      setSuccess('Колоды загружены');
    } catch (error) {
      setFailure(`Ошибка загрузки: ${readError(error)}`);
    } finally {
      setLoadingDecks(false);
    }
  };

  const loginByToken = () => {
    const normalized = tokenInput.trim();
    setToken(normalized);
    localStorage.setItem(TOKEN_KEY, normalized);
    setSuccess('Токен сохранён');
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setTokenInput('');
    setDecks([]);
    resetToNewDeck();
    setSuccess('Выход выполнен');
  };

  const applyDraft = () => {
    const normalizedQuestions = draft.questions
      .map((question) => ({
        ...question,
        id: question.id.trim() || createQuestionId(),
        type: question.type.trim(),
        content: question.content.trim(),
        complexity: Number.isFinite(question.complexity) ? question.complexity : 1,
      }))
      .filter((question) => question.content.length > 0);

    if (!draft.name.trim()) {
      throw new Error('Название колоды обязательно');
    }

    if (!draft.cover.trim()) {
      throw new Error('Нужно указать или загрузить обложку');
    }

    if (normalizedQuestions.length === 0) {
      throw new Error('Добавь хотя бы один вопрос');
    }

    return {
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      cover: draft.cover.trim(),
      categories: draft.categories,
      questions: normalizedQuestions,
      questionsCount: normalizedQuestions.length,
      priceRub: Math.max(0, draft.priceRub),
    };
  };

  const createDeck = async () => {
    try {
      const payload = applyDraft();
      setSaving(true);
      await api.post('/api/admin/decks', payload);
      setSuccess('Колода создана');
      await loadDecks();
    } catch (error) {
      setFailure(`Ошибка создания: ${error instanceof Error ? error.message : readError(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const updateDeck = async () => {
    if (!selectedDeckId) {
      setFailure('Выбери колоду для сохранения');
      return;
    }

    try {
      const payload = {
        id: selectedDeckId,
        ...applyDraft(),
      };
      setSaving(true);
      await api.put('/api/admin/decks', payload);
      setSuccess('Колода обновлена');
      await loadDecks();
    } catch (error) {
      setFailure(`Ошибка обновления: ${error instanceof Error ? error.message : readError(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteDeck = async () => {
    if (!selectedDeckId) {
      setFailure('Выбери колоду для удаления');
      return;
    }

    try {
      setSaving(true);
      await api.delete(`/api/admin/decks/${selectedDeckId}`);
      setSuccess('Колода удалена');
      const remainingDecks = decks.filter((deck) => deck.id !== selectedDeckId);
      setDecks(remainingDecks);
      if (remainingDecks.length === 0) {
        resetToNewDeck();
      } else {
        const next = remainingDecks[0];
        setSelectedDeckId(next.id);
        mapDeckToDraft(next);
      }
    } catch (error) {
      setFailure(`Ошибка удаления: ${readError(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const uploadCover = async (file: File) => {
    if (!token) {
      setFailure('Сначала укажи admin token');
      return;
    }

    const formData = new FormData();
    formData.append('coverFile', file);

    setUploadingCover(true);
    try {
      const response = await api.post<ApiEnvelope<{ cover: string }>>(
        '/api/admin/decks/upload-cover',
        formData,
      );

      const uploadedCover = response.data.payload.cover;
      setDraft((prev) => ({ ...prev, cover: uploadedCover }));
      setSuccess('Обложка загружена');
    } catch (error) {
      setFailure(`Ошибка загрузки обложки: ${readError(error)}`);
    } finally {
      setUploadingCover(false);
    }
  };

  const updateQuestion = (index: number, patch: Partial<DeckQuestion>) => {
    setDraft((prev) => {
      const nextQuestions = prev.questions.map((question, currentIndex) =>
        currentIndex === index ? { ...question, ...patch } : question,
      );
      return { ...prev, questions: nextQuestions };
    });
  };

  const addQuestion = () => {
    setDraft((prev) => ({
      ...prev,
      questions: [...prev.questions, createQuestion()],
    }));
  };

  const removeQuestion = (index: number) => {
    setDraft((prev) => {
      if (prev.questions.length <= 1) {
        return prev;
      }
      const nextQuestions = prev.questions.filter((_, currentIndex) => currentIndex !== index);
      return { ...prev, questions: nextQuestions };
    });
  };

  const addCategory = () => {
    const normalized = categoryInput.trim();
    if (!normalized) return;

    setDraft((prev) => {
      if (prev.categories.includes(normalized)) {
        return prev;
      }
      return { ...prev, categories: [...prev.categories, normalized] };
    });
    setCategoryInput('');
  };

  const removeCategory = (category: string) => {
    setDraft((prev) => ({
      ...prev,
      categories: prev.categories.filter((item) => item !== category),
    }));
  };

  return (
    <div className="page">
      <header className="topbar">
        <h1>Deck Editor</h1>
        <div className="row">
          <button onClick={resetToNewDeck} disabled={!token}>Новая колода</button>
          <button onClick={loadDecks} disabled={!token || loadingDecks}>
            {loadingDecks ? 'Загрузка...' : 'Обновить список'}
          </button>
        </div>
      </header>

      <section className="card auth-card">
        <label>Admin token</label>
        <input
          value={tokenInput}
          onChange={(event) => setTokenInput(event.target.value)}
          placeholder="deckadm_..."
        />
        <div className="row">
          <button onClick={loginByToken}>Войти</button>
          <button onClick={logout} className="danger">Выйти</button>
        </div>
      </section>

      <section className="grid">
        <aside className="card sidebar">
          <h2>Колоды</h2>
          {decks.length === 0 ? <p className="muted">Список пуст</p> : null}
          {decks.map((deck) => (
            <button
              key={deck.id}
              className={deck.id === selectedDeckId ? 'item active' : 'item'}
              onClick={() => {
                setSelectedDeckId(deck.id);
                mapDeckToDraft(deck);
              }}
            >
              <span>{deck.name}</span>
              <small>{(deck.priceRub ?? 0) > 0 ? `${deck.priceRub ?? 0} ₽` : 'free'}</small>
            </button>
          ))}
        </aside>

        <div className="card editor">
          <h2>{selectedDeck ? `Редактирование: ${selectedDeck.name}` : 'Новая колода'}</h2>

          <div className="cover-block">
            <div className="cover-preview-wrap">
              {draft.cover ? <img src={draft.cover} alt="cover" className="cover-preview" /> : <div className="cover-placeholder">Нет обложки</div>}
            </div>
            <div className="cover-controls">
              <label>Обложка колоды</label>
              <label className="upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void uploadCover(file);
                    }
                    event.currentTarget.value = '';
                  }}
                  disabled={!token || uploadingCover}
                />
                {uploadingCover ? 'Загрузка...' : 'Загрузить обложку'}
              </label>
            </div>
          </div>

          <label>Название</label>
          <input
            value={draft.name}
            onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
          />

          <label>Описание</label>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
          />

          <div className="row">
            <div className="col">
              <label>Возраст</label>
              <input
                type="number"
                value={draft.ageLimit}
                onChange={(e) => setDraft((prev) => ({ ...prev, ageLimit: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="col">
              <label>Цена (₽)</label>
              <input
                type="number"
                value={draft.priceRub}
                onChange={(e) => setDraft((prev) => ({ ...prev, priceRub: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="categories-block">
            <label>Категории</label>
            <div className="row">
              <input
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                placeholder="Например: Кринж детства"
              />
              <button onClick={addCategory} type="button">Добавить категорию</button>
            </div>
            <div className="categories-list">
              {draft.categories.length === 0 ? (
                <p className="muted">Категории не добавлены</p>
              ) : (
                draft.categories.map((category) => (
                  <button
                    key={category}
                    className="category-chip"
                    type="button"
                    onClick={() => removeCategory(category)}
                    title="Удалить категорию"
                  >
                    {category} ×
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="questions-header">
            <h3>Вопросы</h3>
            <button onClick={addQuestion}>Добавить вопрос</button>
          </div>

          <div className="questions-list">
            {draft.questions.map((question, index) => (
              <div key={question.id || `${index}`} className="question-card">
                <div className="row question-top">
                  <strong>#{index + 1}</strong>
                  <button
                    className="danger"
                    onClick={() => removeQuestion(index)}
                    disabled={draft.questions.length <= 1}
                  >
                    Удалить
                  </button>
                </div>

                <div className="row">
                  <div className="col">
                    <label>Тип</label>
                    <input
                      value={question.type}
                      onChange={(e) => updateQuestion(index, { type: e.target.value })}
                    />
                  </div>
                  <div className="col">
                    <label>Сложность</label>
                    <input
                      type="number"
                      value={question.complexity}
                      onChange={(e) => updateQuestion(index, { complexity: Number(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                <label>Текст вопроса</label>
                <textarea
                  value={question.content}
                  onChange={(e) => updateQuestion(index, { content: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div className="row">
            <button onClick={createDeck} disabled={!token || saving}>Создать</button>
            <button onClick={updateDeck} disabled={!token || !selectedDeckId || saving}>Сохранить</button>
            <button onClick={deleteDeck} className="danger" disabled={!token || !selectedDeckId || saving}>
              Удалить
            </button>
          </div>
        </div>
      </section>

      {status ? <p className={`status ${statusType === 'error' ? 'error' : 'ok'}`}>{status}</p> : null}
    </div>
  );
}
