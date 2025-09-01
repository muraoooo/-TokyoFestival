import React, { useState } from 'react';
import { CustomOption } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  personality: string;
  topic: string;
  customPersonalities: CustomOption[];
  customTopics: CustomOption[];
  onPersonalityChange: (value: string) => void;
  onTopicChange: (value: string) => void;
  onAddCustomPersonality: (option: CustomOption) => void;
  onAddCustomTopic: (option: CustomOption) => void;
  onDeleteCustomPersonality: (id: string) => void;
  onDeleteCustomTopic: (id: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  personality,
  topic,
  customPersonalities,
  customTopics,
  onPersonalityChange,
  onTopicChange,
  onAddCustomPersonality,
  onAddCustomTopic,
  onDeleteCustomPersonality,
  onDeleteCustomTopic,
}) => {
  const [newPersonality, setNewPersonality] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [activeTab, setActiveTab] = useState<'sources' | 'settings'>('settings');
  const [speechRate, setSpeechRate] = useState(() => {
    return parseFloat(localStorage.getItem('speechRate') || '0.9');
  });

  const defaultPersonalities = [
    { id: 'standard', value: 'standard', label: 'フレンドリー（標準）' },
    { id: 'charismatic-sarcastic', value: 'charismatic-sarcastic', label: 'カリスマ熱血 × 皮肉屋' },
    { id: 'calm-sharp', value: 'calm-sharp', label: '冷静知的 × 毒舌' },
    { id: 'hyper-dark', value: 'hyper-dark', label: 'ハイテンション × ブラックジョーク' },
    { id: 'easygoing-honest', value: 'easygoing-honest', label: 'おっとり × 怖いくらい正直' },
    { id: 'hearty-direct', value: 'hearty-direct', label: '豪快 × 直球毒舌' },
  ];

  const defaultTopics = [
    { id: 'world', value: 'world', label: '世界・政治 (World & Politics)' },
    { id: 'business', value: 'business', label: 'ビジネス・経済 (Business & Economy)' },
    { id: 'science', value: 'science', label: '科学・テクノロジー (Science & Technology)' },
    { id: 'culture', value: 'culture', label: '文化・生活 (Culture & Lifestyle)' },
    { id: 'human', value: 'human', label: '人間ドラマ・その他 (Human Stories & Others)' },
  ];

  const handleAddPersonality = () => {
    if (newPersonality.trim()) {
      const newOption: CustomOption = {
        id: `custom-${Date.now()}`,
        value: newPersonality,
        label: newPersonality,
      };
      onAddCustomPersonality(newOption);
      setNewPersonality('');
    }
  };

  const handleAddTopic = () => {
    if (newTopic.trim()) {
      const newOption: CustomOption = {
        id: `custom-${Date.now()}`,
        value: newTopic,
        label: newTopic,
      };
      onAddCustomTopic(newOption);
      setNewTopic('');
    }
  };

  const handleSpeechRateChange = (newRate: number) => {
    setSpeechRate(newRate);
    localStorage.setItem('speechRate', newRate.toString());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-emerald-50 to-green-50">
          <h2 className="text-xl font-bold text-gray-800">設定</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 px-4 font-medium transition ${
              activeTab === 'settings'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            AIの性格・ニュースのジャンル
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`flex-1 py-3 px-4 font-medium transition ${
              activeTab === 'sources'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            ソースを追加
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'settings' ? (
            <div className="space-y-6">
              {/* Speech Rate Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">🔊 音声読み上げ速度</h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-12">遅い</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={speechRate}
                    onChange={(e) => handleSpeechRateChange(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-sm text-gray-600 w-12 text-right">速い</span>
                  <div className="bg-white px-3 py-1 rounded-md shadow-sm border border-gray-200">
                    <span className="font-mono text-sm font-semibold text-blue-600">{speechRate.toFixed(1)}x</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  標準: 0.9x | 現在: {speechRate.toFixed(1)}x
                </div>
              </div>

              {/* AI Personality Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">AIの性格</h3>
                <div className="space-y-2 mb-4">
                  {[...defaultPersonalities, ...customPersonalities].map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        id={option.id}
                        name="personality"
                        value={option.value}
                        checked={personality === option.value}
                        onChange={(e) => onPersonalityChange(e.target.value)}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <label htmlFor={option.id} className="flex-1 cursor-pointer">
                        {option.label}
                      </label>
                      {option.id.startsWith('custom-') && (
                        <button
                          onClick={() => onDeleteCustomPersonality(option.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPersonality}
                    onChange={(e) => setNewPersonality(e.target.value)}
                    placeholder="カスタム性格を入力"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleAddPersonality}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
                  >
                    追加
                  </button>
                </div>
              </div>

              {/* News Genre Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">ニュースのジャンル</h3>
                <div className="space-y-2 mb-4">
                  {[...defaultTopics, ...customTopics].map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        id={`topic-${option.id}`}
                        name="topic"
                        value={option.value}
                        checked={topic === option.value}
                        onChange={(e) => onTopicChange(e.target.value)}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <label htmlFor={`topic-${option.id}`} className="flex-1 cursor-pointer">
                        {option.label}
                      </label>
                      {option.id.startsWith('custom-') && (
                        <button
                          onClick={() => onDeleteCustomTopic(option.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="カスタムジャンルを入力"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleAddTopic}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
                  >
                    追加
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                ソースを追加すると、NotebookLMがユーザーにとって最も重要な情報を見つけるようになります。
                （例：マーケティング資料、ユースリサーチ、調査メモ、会議の文字起こし、セールスドキュメントなど）
              </p>

              {/* Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-600 mb-2">ソースをアップロード</p>
                <p className="text-sm text-gray-500 mb-4">ドラッグ＆ドロップまたはファイルを選択してアップロード</p>
                <p className="text-xs text-gray-400">サポートされているファイル形式: PDF, .txt, Markdown, 音声（英・日・スペイン語）</p>
              </div>

              {/* Source Options Grid */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <svg className="w-8 h-8 mx-auto mb-2 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                  <p className="text-sm">Google ドライブ</p>
                </button>

                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <svg className="w-8 h-8 mx-auto mb-2 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  <p className="text-sm">Google ドキュメント</p>
                </button>

                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <svg className="w-8 h-8 mx-auto mb-2 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10,2V4H14V2H10M9,4H5V6H9V4M15,4V6H19V4H15M5,7V20L12,17L19,20V7H5Z"/>
                  </svg>
                  <p className="text-sm">Google スライド</p>
                </button>

                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 12l-18 0m18 0l-6-6m6 6l-6 6"/>
                  </svg>
                  <p className="text-sm">リンク</p>
                </button>

                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <svg className="w-8 h-8 mx-auto mb-2 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <p className="text-sm">ウェブサイト</p>
                </button>

                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <svg className="w-8 h-8 mx-auto mb-2 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
                  </svg>
                  <p className="text-sm">YouTube</p>
                </button>

                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19,8L15,12H18A6,6 0 0,1 12,18C11,18 10.03,17.75 9.2,17.3L7.74,18.76C8.97,19.54 10.43,20 12,20A8,8 0 0,0 20,12H23M6,12A6,6 0 0,1 12,6C13,6 13.97,6.25 14.8,6.7L16.26,5.24C15.03,4.46 13.57,4 12,4A8,8 0 0,0 4,12H1L5,16L9,12"/>
                  </svg>
                  <p className="text-sm">コピーしたテキスト</p>
                </button>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  注意: 現在これらの機能は開発中です。今後のアップデートで利用可能になります。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};