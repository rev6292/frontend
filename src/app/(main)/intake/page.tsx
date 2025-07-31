'use client';

import React, { useState } from 'react';
import IntakeProcessingTab from '@/components/intake/IntakeProcessingTab';
import PurchaseOrderManagementTab from '@/components/intake/PurchaseOrderManagementTab';
import PurchaseOrderListTab from '@/components/intake/PurchaseOrderListTab';
import SupplierManagementTab from '@/components/intake/SupplierManagementTab';

const IntakePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('intakeProcessing');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'intakeProcessing':
        return <IntakeProcessingTab />;
      case 'purchaseOrderManagement':
        return <PurchaseOrderManagementTab />;
      case 'purchaseOrderList':
        return <PurchaseOrderListTab />;
      case 'supplierManagement':
        return <SupplierManagementTab />;
      default:
        return <IntakeProcessingTab />;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-gray-800">入荷・発注管理</h1>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('intakeProcessing')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'intakeProcessing' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            入荷処理
          </button>
          <button
            onClick={() => setActiveTab('purchaseOrderManagement')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'purchaseOrderManagement' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            発注管理
          </button>
          <button
            onClick={() => setActiveTab('purchaseOrderList')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'purchaseOrderList' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            発注書一覧
          </button>
          <button
            onClick={() => setActiveTab('supplierManagement')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'supplierManagement' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            仕入先管理
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default IntakePage;