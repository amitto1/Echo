'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistCreated?: (playlist: any) => void;
}

export default function CreatePlaylistModal({
  isOpen,
  onClose,
  onPlaylistCreated,
}: CreatePlaylistModalProps) {
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const userId = (session?.user as any)?.id || session?.user?.email || 'default_user';

      const response = await fetch(`${backendUrl}/api/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(session as any)?.accessToken || ''}`,
        },
        body: JSON.stringify({ userId, name, description }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create playlist');
      }

      if (onPlaylistCreated) {
        onPlaylistCreated(data.data);
      }

      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-zinc-900 p-6 border border-zinc-800 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Create Playlist</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
              Name
            </label>
            <input
              type="text"
              placeholder="e.g. My Chill Hits"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 border border-zinc-700 focus:border-purple-500 focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
              Description (Optional)
            </label>
            <textarea
              placeholder="Add an optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 border border-zinc-700 focus:border-purple-500 focus:outline-none text-sm resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}