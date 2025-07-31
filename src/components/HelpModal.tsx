'use client';

import React from 'react';
import Modal from './Modal'; // Modal コンポーネントをインポート

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ヘルプ / ガイド">
      <div className="space-y-4 text-gray-700">
        <p>このアプリケーションは、サロンの在庫管理を効率化するためのツールです。</p>
        <h3 className="text-lg font-semibold text-gray-800">主な機能:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>ダッシュボード:</strong> 在庫の全体像、主要な指標、グラフなどを確認できます。</li>
          <li><strong>在庫管理:</strong> 商品の追加、編集、削除、在庫数の確認ができます。</li>
          <li><strong>入荷処理:</strong> 商品の入荷を記録し、在庫を更新します。</li>
          <li><strong>出庫処理:</strong> 商品の出庫を記録し、在庫を減らします。</li>
          <li><strong>レポート:</strong> 月次レポートなどを生成し、ビジネスの分析に役立てます。</li>
        </ul>
        <h3 className="text-lg font-semibold text-gray-800">使い方:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>左側のサイドバーから各機能にアクセスできます。</li>
          <li>各ページには、操作を助けるためのボタンやフィルターが用意されています。</li>
          <li>不明な点があれば、各ページの「ヘルプ / ガイド」ボタンをクリックしてください。</li>
        </ul>
        <p className="text-sm text-gray-500">ご不明な点がございましたら、システム管理者にお問い合わせください。</p>
      </div>
    </Modal>
  );
};

export default HelpModal;
