import React, { useState, useRef, useEffect } from 'react';
import { useSavedItems } from '../context/SavedItemsContext';
import { useTranslation } from 'react-i18next';
import '../styles/NotesSidebar.css';

const NotesSidebar = () => {
    const { savedItems, isSidebarOpen, toggleSidebar, addNote, updateNote, removeItem } = useSavedItems();
    const { t } = useTranslation();
    const [selectedId, setSelectedId] = useState(null);
    const textareaRef = useRef(null);

    const notes = savedItems.filter(item => item.isNote || !item.type); // Broadly notes

    useEffect(() => {
        if (selectedId && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [selectedId]);

    const handleAddNote = () => {
        const id = addNote();
        setSelectedId(id);
    };

    const selectedNote = notes.find(n => n.id === selectedId);

    return (
        <div className={`notes-sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => toggleSidebar(false)}>
            <div className="notes-sidebar-container" onClick={e => e.stopPropagation()}>
                <div className="notes-sidebar-header">
                    <div className="header-left">
                        <button className="sidebar-icon-btn" onClick={() => toggleSidebar(false)}>
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <h2>Notes</h2>
                    </div>
                    <button className="add-note-btn" onClick={handleAddNote}>
                        <span className="material-symbols-outlined">edit_square</span>
                    </button>
                </div>

                <div className="notes-sidebar-layout">
                    {/* List of notes */}
                    <div className="notes-list">
                        {notes.length === 0 ? (
                            <div className="empty-notes">
                                <span className="material-symbols-outlined">description</span>
                                <p>Hech qanday eslatma yo'q</p>
                            </div>
                        ) : (
                            notes.map(note => (
                                <div
                                    key={note.id}
                                    className={`note-item ${selectedId === note.id ? 'active' : ''}`}
                                    onClick={() => setSelectedId(note.id)}
                                >
                                    <div className="note-item-content">
                                        <h3>{note.title || 'Mavzusiz'}</h3>
                                        <p>{note.description || 'Matn yo\'q'}</p>
                                        <span className="note-date">
                                            {new Date(note.date).toLocaleDateString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <button className="delete-note-mini" onClick={(e) => {
                                        e.stopPropagation();
                                        removeItem(note.id);
                                        if (selectedId === note.id) setSelectedId(null);
                                    }}>
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Editor area */}
                    <div className="note-editor">
                        {selectedNote ? (
                            <>
                                <input
                                    type="text"
                                    className="note-title-input"
                                    placeholder="Sarlavha..."
                                    value={selectedNote.title || ''}
                                    onChange={(e) => updateNote(selectedId, { title: e.target.value })}
                                />
                                <div className="editor-divider"></div>
                                <textarea
                                    ref={textareaRef}
                                    className="note-description-textarea"
                                    placeholder="Eslatma yozing..."
                                    value={selectedNote.description || ''}
                                    onChange={(e) => updateNote(selectedId, { description: e.target.value })}
                                />
                            </>
                        ) : (
                            <div className="no-note-selected">
                                <span className="material-symbols-outlined">edit_note</span>
                                <p>Tahrirlash uchun eslatmani tanlang yoki yangisini qo'shing</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotesSidebar;
