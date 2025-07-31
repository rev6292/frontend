'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { APP_TITLE, ROUTE_PATHS } from '../constants';
import { KeyIcon, UserIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

// 動的インポートでSSRを無効化
const LoginPage = dynamic(() => Promise.resolve(LoginPageComponent), {
  ssr: false,
});

const LoginPageComponent: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const router = useRouter();

  // AuthContextの初期化を待つ
  let currentUser = null;
  let login = null;
  
  try {
    const auth = useAuth();
    currentUser = auth.currentUser;
    login = auth.login;
    if (!authInitialized) {
      setAuthInitialized(true);
      console.log('LoginPage: AuthContext initialized successfully');
    }
  } catch (err) {
    console.error('AuthContext not available:', err);
    if (!authInitialized) {
      setAuthInitialized(true);
    }
  }

  // デバッグ用：currentUserの状態をログ出力
  useEffect(() => {
    console.log('LoginPage: currentUser changed:', currentUser);
  }, [currentUser]);

  // ログイン状態を監視し、ログイン済みであればダッシュボードへリダイレクト
  useEffect(() => {
    if (currentUser && !isRedirecting) {
      console.log('LoginPage: User logged in, redirecting to dashboard...');
      console.log('LoginPage: currentUser:', currentUser);
      console.log('LoginPage: ROUTE_PATHS.DASHBOARD:', ROUTE_PATHS.DASHBOARD);
      setIsRedirecting(true);
      
      // 少し遅延を入れてからリダイレクト
      setTimeout(() => {
        console.log('LoginPage: Executing redirect...');
        // window.location.hrefを直接使用して確実にリダイレクト
        window.location.href = ROUTE_PATHS.DASHBOARD;
        console.log('LoginPage: Redirect executed');
      }, 100);
    }
  }, [currentUser, router, isRedirecting]);

  // リダイレクト状態をリセット（デバッグ用）
  useEffect(() => {
    if (!currentUser) {
      setIsRedirecting(false);
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    console.log('LoginPage: Attempting login with userId:', userId);
    
    if (!login) {
      setError('認証システムが利用できません。');
      setIsLoading(false);
      return;
    }
    
    try {
      await login(userId, password);
      console.log('LoginPage: Login successful');
      console.log('LoginPage: currentUser after login:', currentUser);
      // ログイン成功後、useEffect がリダイレクトを処理する
    } catch (err) {
      console.error('LoginPage: Login failed:', err);
      setError((err as Error).message || 'ログインに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // AuthContextが初期化されていない場合
  if (!authInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">アプリケーションを初期化中...</p>
        </div>
      </div>
    );
  }

  // AuthContextが利用できない場合
  if (!login) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-white text-lg">認証システムの初期化に失敗しました。</p>
          <p className="text-white text-sm mt-2">ページを再読み込みしてください。</p>
        </div>
      </div>
    );
  }

  // currentUser が存在する場合は、リダイレクト中のローディング画面を表示
  if (currentUser || isRedirecting) {
    console.log('LoginPage: Showing loading screen');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">ログイン中...</p>
          <p className="text-white text-sm mt-2">ユーザー: {currentUser?.name}</p>
          <p className="text-white text-xs mt-1">ダッシュボードにリダイレクト中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 shadow-xl rounded-lg">
        <div>
          <h1 className="text-center text-3xl font-bold text-white">
            {APP_TITLE}
          </h1>
          <p className="mt-2 text-center text-sm text-gray-300">
            ログインしてください
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="userId" className="sr-only">ユーザーID</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                 </div>
                <input
                  id="userId"
                  name="userId"
                  type="text"
                  autoComplete="username"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-slate-700 placeholder-slate-400 text-white bg-slate-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="ユーザーID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password-input" className="sr-only">パスワード</label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                 </div>
                <input
                  id="password-input"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-slate-700 placeholder-slate-400 text-white bg-slate-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="パスワード"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center text-sm text-red-400">
                <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:opacity-75"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'ログイン'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
