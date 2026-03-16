import { useEffect, useState, useCallback } from 'react';
import { api, type ApiEnvelope } from '../../api/client';
import './Decks.css';

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
  const maybeAxios = error as {
    response?: { data?: unknown };
    message?: string;
  };
  const maybeEnvelope = maybeAxios.response?.data as
    | { errorCode?: string; message?: string }
    | undefined;

  if (maybeEnvelope?.errorCode) return maybeEnvelope.errorCode;
  if (maybeEnvelope?.message) return maybeEnvelope.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Неизвестная ошибка';
}

export function DeckEditor() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DeckDraft>(defaultDraft);
  const [categoryInput, setCategoryInput] = useState('');
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'ok' | 'error'>('ok');
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedDeck =
    decks.find((deck) => deck.id === selectedDeckId) ?? null;

  const setSuccess = (message: string) => {
    setStatusType('ok');
    setStatus(message);
  };

  const setFailure = (message: string) => {
    setStatusType('error');
    setStatus(message);
  };

  const mapDeckToDraft = (deck: Deck) => {
    const normalizedQuestions =
      deck.questions.length > 0 ? deck.questions : [createQuestion()];
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

  const loadDecks = useCallback(async () => {
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

      setDecks((prev) => {
        const stillSelected = selectedDeckId
          ? list.find((item) => item.id === selectedDeckId)
          : null;
        const next = stillSelected ?? list[0];
        setSelectedDeckId(next.id);
        mapDeckToDraft(next);
        return prev;
      });

      setDecks(list);
      setSuccess('Колоды загружены');
    } catch (error) {
      setFailure(`Ошибка загрузки: ${readError(error)}`);
    } finally {
      setLoadingDecks(false);
    }
  }, [selectedDeckId]);

  useEffect(() => {
    void loadDecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyDraft = () => {
    const normalizedQuestions = draft.questions
      .map((question) => ({
        ...question,
        id: question.id.trim() || createQuestionId(),
        type: question.type.trim(),
        content: question.content.trim(),
        complexity: Number.isFinite(question.complexity)
          ? question.complexity
          : 1,
      }))
      .filter((question) => question.content.length > 0);

    if (!draft.name.trim()) throw new Error('Название колоды обязательно');
    if (!draft.cover.trim())
      throw new Error('Нужно указать или загрузить обложку');
    if (normalizedQuestions.length === 0)
      throw new Error('Добавь хотя бы один вопрос');

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
      setFailure(
        `Ошибка создания: ${error instanceof Error ? error.message : readError(error)}`,
      );
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
      const payload = { id: selectedDeckId, ...applyDraft() };
      setSaving(true);
      await api.put('/api/admin/decks', payload);
      setSuccess('Колода обновлена');
      await loadDecks();
    } catch (error) {
      setFailure(
        `Ошибка обновления: ${error instanceof Error ? error.message : readError(error)}`,
      );
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
      const remaining = decks.filter((deck) => deck.id !== selectedDeckId);
      setDecks(remaining);
      if (remaining.length === 0) {
        resetToNewDeck();
      } else {
        setSelectedDeckId(remaining[0].id);
        mapDeckToDraft(remaining[0]);
      }
    } catch (error) {
      setFailure(`Ошибка удаления: ${readError(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const uploadCover = async (file: File) => {
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
    setDraft((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, ...patch } : q,
      ),
    }));
  };

  const addQuestion = () => {
    setDraft((prev) => ({
      ...prev,
      questions: [...prev.questions, createQuestion()],
    }));
  };

  const removeQuestion = (index: number) => {
    setDraft((prev) => {
      if (prev.questions.length <= 1) return prev;
      return {
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index),
      };
    });
  };

  const addCategory = () => {
    const normalized = categoryInput.trim();
    if (!normalized) return;
    setDraft((prev) => {
      if (prev.categories.includes(normalized)) return prev;
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
    <div className="de-page">
      <div className="de-topbar">
        <div className="de-topbar-actions">
          <button className="secondary" onClick={resetToNewDeck}>
            Новая колода
          </button>
          <button onClick={() => loadDecks()} disabled={loadingDecks}>
            {loadingDecks ? 'Загрузка...' : 'Обновить список'}
          </button>
        </div>
      </div>

      <div className="de-grid">
        <aside className="card de-sidebar">
          <h3>Колоды</h3>
          {decks.length === 0 ? (
            <p className="muted">Список пуст</p>
          ) : null}
          {decks.map((deck) => (
            <button
              key={deck.id}
              className={`de-item ${deck.id === selectedDeckId ? 'active' : ''}`}
              onClick={() => {
                setSelectedDeckId(deck.id);
                mapDeckToDraft(deck);
              }}
            >
              <span>{deck.name}</span>
              <small className="muted">
                {(deck.priceRub ?? 0) > 0
                  ? `${deck.priceRub ?? 0} ₽`
                  : 'free'}
              </small>
            </button>
          ))}
        </aside>

        <div className="card de-editor">
          <h3>
            {selectedDeck
              ? `Редактирование: ${selectedDeck.name}`
              : 'Новая колода'}
          </h3>

          <div className="de-cover-block">
            <div className="de-cover-preview-wrap">
              {draft.cover ? (
                <img
                  src={draft.cover}
                  alt="cover"
                  className="de-cover-preview"
                />
              ) : (
                <div className="de-cover-placeholder">Нет обложки</div>
              )}
            </div>
            <div className="de-cover-controls">
              <label>Обложка колоды</label>
              <label className="de-upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadCover(file);
                    event.currentTarget.value = '';
                  }}
                  disabled={uploadingCover}
                />
                {uploadingCover ? 'Загрузка...' : 'Загрузить обложку'}
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Название</label>
            <input
              value={draft.name}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={draft.description}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>

          <div className="de-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Возраст</label>
              <input
                type="number"
                value={draft.ageLimit}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    ageLimit: Number(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Цена (₽)</label>
              <input
                type="number"
                value={draft.priceRub}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    priceRub: Number(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label>Категории</label>
            <div className="de-row">
              <input
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                placeholder="Например: Кринж детства"
                style={{ flex: 1 }}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              />
              <button onClick={addCategory} type="button">
                Добавить
              </button>
            </div>
            <div className="de-categories-list">
              {draft.categories.length === 0 ? (
                <p className="muted" style={{ fontSize: '0.8rem' }}>
                  Категории не добавлены
                </p>
              ) : (
                draft.categories.map((category) => (
                  <button
                    key={category}
                    className="de-category-chip"
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

          <div className="de-questions-header">
            <h3>Вопросы ({draft.questions.length})</h3>
            <button onClick={addQuestion}>Добавить вопрос</button>
          </div>

          <div className="de-questions-list">
            {draft.questions.map((question, index) => (
              <div
                key={question.id || `${index}`}
                className="de-question-card"
              >
                <div className="de-question-top">
                  <strong>#{index + 1}</strong>
                  <button
                    className="danger"
                    onClick={() => removeQuestion(index)}
                    disabled={draft.questions.length <= 1}
                    style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  >
                    Удалить
                  </button>
                </div>

                <div className="de-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Тип</label>
                    <input
                      value={question.type}
                      onChange={(e) =>
                        updateQuestion(index, { type: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Сложность</label>
                    <input
                      type="number"
                      value={question.complexity}
                      onChange={(e) =>
                        updateQuestion(index, {
                          complexity: Number(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Текст вопроса</label>
                  <textarea
                    value={question.content}
                    onChange={(e) =>
                      updateQuestion(index, { content: e.target.value })
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="de-row" style={{ marginTop: 8 }}>
            <button onClick={createDeck} disabled={saving}>
              Создать
            </button>
            <button
              onClick={updateDeck}
              disabled={!selectedDeckId || saving}
            >
              Сохранить
            </button>
            <button
              className="danger"
              onClick={deleteDeck}
              disabled={!selectedDeckId || saving}
            >
              Удалить
            </button>
          </div>
        </div>
      </div>

      {status ? (
        <div
          className={`de-status ${statusType === 'error' ? 'de-status-error' : 'de-status-ok'}`}
        >
          {status}
        </div>
      ) : null}
    </div>
  );
}
