"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

export default function NotepadPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    // 로컬 스토리지에서 노트 불러오기
    const savedNotes = localStorage.getItem("notepad-notes");
    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
      }));
      setNotes(parsedNotes);
    }
  }, []);

  const saveNotes = (newNotes: Note[]) => {
    setNotes(newNotes);
    localStorage.setItem("notepad-notes", JSON.stringify(newNotes));
  };

  const createNewNote = () => {
    if (!title.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date(),
    };

    const newNotes = [newNote, ...notes];
    saveNotes(newNotes);
    setCurrentNote(newNote);
    setTitle("");
    setContent("");
  };

  const updateNote = () => {
    if (!currentNote || !title.trim()) return;

    const updatedNote = {
      ...currentNote,
      title: title.trim(),
      content: content.trim(),
    };

    const newNotes = notes.map((note) => (note.id === currentNote.id ? updatedNote : note));

    saveNotes(newNotes);
    setCurrentNote(updatedNote);
  };

  const deleteNote = (noteId: string) => {
    const newNotes = notes.filter((note) => note.id !== noteId);
    saveNotes(newNotes);

    if (currentNote?.id === noteId) {
      setCurrentNote(null);
      setTitle("");
      setContent("");
    }
  };

  const selectNote = (note: Note) => {
    setCurrentNote(note);
    setTitle(note.title);
    setContent(note.content);
  };

  const clearEditor = () => {
    setCurrentNote(null);
    setTitle("");
    setContent("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">📝 메모장</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← 홈으로
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Notes List */}
          <div>
            <Card>
              <h2 className="text-lg font-semibold mb-4">저장된 메모 ({notes.length})</h2>

              {notes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  저장된 메모가 없습니다.
                  <br />새 메모를 작성해보세요!
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        currentNote?.id === note.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => selectNote(note)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{note.title}</h3>
                          <p className="text-xs text-gray-500 mt-1">{note.createdAt.toLocaleString()}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(note.id);
                          }}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Editor */}
          <div>
            <Card>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">{currentNote ? "메모 편집" : "새 메모 작성"}</h2>
                  {currentNote && (
                    <Button variant="outline" size="sm" onClick={clearEditor}>
                      새 메모
                    </Button>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="제목을 입력하세요..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <textarea
                    placeholder="내용을 입력하세요..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={15}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex space-x-2">
                  {currentNote ? (
                    <Button onClick={updateNote} disabled={!title.trim()}>
                      메모 수정
                    </Button>
                  ) : (
                    <Button onClick={createNewNote} disabled={!title.trim()}>
                      메모 저장
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
