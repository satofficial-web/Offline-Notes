import React, { useState } from 'react';
import { CloseIcon, DatabaseIcon, ShieldIcon, FileTextIcon, HeartIcon, LanguageIcon, UploadIcon } from './Icons';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBackup: () => void;
}

type Tab = 'privacy' | 'terms' | 'credits';
type Language = 'id' | 'en';

const translations = {
  id: {
    title: 'Tentang Aplikasi',
    privacyTab: 'Penyimpanan & Privasi',
    termsTab: 'Aturan Penggunaan',
    creditsTab: 'Kredit',
    privacyTitle: 'Privasi Anda adalah Prioritas Utama',
    privacyIntro: 'Aplikasi ini beroperasi dengan prinsip **offline-first**. Artinya, seluruh data yang Anda buat—catatan, tag, dan semuanya—disimpan **secara eksklusif di perangkat Anda**.',
    storageTitle: 'Penyimpanan Lokal (IndexedDB)',
    storagePoint1: '<strong class="text-slate-700 dark:text-slate-200">Tidak Ada Server, Tidak Ada Cloud:</strong> Kami tidak pernah mengirim, menyimpan, atau memiliki akses ke catatan Anda. Data Anda tidak pernah meninggalkan komputer Anda.',
    storagePoint2: '<strong class="text-slate-700 dark:text-slate-200">Anda Memegang Kendali Penuh:</strong> Data Anda disimpan dalam database peramban (IndexedDB). Anda adalah satu-satunya pemilik dan pengelola data tersebut.',
    storagePoint3: '<strong class="text-red-500 dark:text-red-400">PENTING:</strong> Menghapus data cache atau riwayat peramban Anda dapat <strong>menghapus semua catatan Anda secara permanen</strong>.',
    storagePoint4: '<strong class="text-yellow-600 dark:text-yellow-400">Saran Backup:</strong> Kami sangat menyarankan Anda untuk secara rutin mengekspor catatan penting Anda sebagai cadangan.',
    backupButton: 'Buka Menu Backup & Restore',
    termsTitle: 'Aturan Penggunaan',
    termsIntro: 'Dengan menggunakan aplikasi ini, Anda menyetujui poin-poin berikut:',
    termsPoint1: '<strong>"Sebagaimana Adanya":</strong> Aplikasi ini disediakan "sebagaimana adanya" tanpa jaminan apa pun. Meskipun kami berusaha untuk memberikan pengalaman terbaik, kami tidak dapat menjamin aplikasi ini akan selalu bebas dari bug.',
    termsPoint2: '<strong>Tanggung Jawab Data:</strong> Anda bertanggung jawab penuh atas data yang Anda buat dan simpan. Kami tidak bertanggung jawab atas kehilangan data apa pun yang mungkin terjadi.',
    termsPoint3: '<strong>Backup adalah Kunci:</strong> Anda memahami pentingnya melakukan backup data Anda secara mandiri melalui fitur ekspor yang disediakan.',
    creditsTitle: 'Lisensi & Kredit',
    creditsQuran: 'All praise and thanks are due to Allah.',
    creditsPoweredBy: '<strong>Powered by:</strong> Google, Gemini, and AI Studio.',
    creditsAssistedBy: '<strong>Development assisted by:</strong> OpenAI technologies.',
    creditsCopyright: '© 2025 SAT18 Official',
    creditsContact: 'For suggestions & contact: sayyidagustian@gmail.com',
    langToggle: 'Switch to English'
  },
  en: {
    title: 'About The App',
    privacyTab: 'Storage & Privacy',
    termsTab: 'Terms of Use',
    creditsTab: 'Credits',
    privacyTitle: 'Your Privacy is a Top Priority',
    privacyIntro: 'This application operates on an **offline-first** principle. This means all the data you create—notes, tags, and everything else—is stored **exclusively on your device**.',
    storageTitle: 'Local Storage (IndexedDB)',
    storagePoint1: '<strong class="text-slate-700 dark:text-slate-200">No Server, No Cloud:</strong> We never send, store, or have access to your notes. Your data never leaves your computer.',
    storagePoint2: '<strong class="text-slate-700 dark:text-slate-200">You Are in Full Control:</strong> Your data is stored in your browser\'s database (IndexedDB). You are the sole owner and manager of that data.',
    storagePoint3: '<strong class="text-red-500 dark:text-red-400">IMPORTANT:</strong> Clearing your browser\'s cache or history may <strong>permanently delete all your notes</strong>.',
    storagePoint4: '<strong class="text-yellow-600 dark:text-yellow-400">Backup Recommendation:</strong> We highly recommend you regularly export your important notes to create backups.',
    backupButton: 'Open Backup & Restore Menu',
    termsTitle: 'Terms of Use',
    termsIntro: 'By using this application, you agree to the following points:',
    termsPoint1: '<strong>"As Is":</strong> This application is provided "as is" without any warranty. While we strive to provide the best experience, we cannot guarantee it will always be free of bugs.',
    termsPoint2: '<strong>Data Responsibility:</strong> You are solely responsible for the data you create and store. We are not liable for any data loss that may occur.',
    termsPoint3: '<strong>Backup is Key:</strong> You understand the importance of independently backing up your data using the provided export features.',
    creditsTitle: 'License & Credits',
    creditsQuran: 'All praise and thanks are due to Allah.',
    creditsPoweredBy: '<strong>Powered by:</strong> Google, Gemini, and AI Studio.',
    creditsAssistedBy: '<strong>Development assisted by:</strong> OpenAI technologies.',
    creditsCopyright: '© 2025 SAT18 Official',
    creditsContact: 'For suggestions & contact: sayyidagustian@gmail.com',
    langToggle: 'Ubah ke Bahasa Indonesia'
  }
};


const TabButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-3 px-4 py-2 text-sm font-medium rounded-md transition-colors w-full text-left ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const PrivacySection: React.FC<{ t: typeof translations['id']; onOpenBackup: () => void }> = ({ t, onOpenBackup }) => (
    <div>
        <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white flex items-center"><ShieldIcon className="h-6 w-6 mr-2 text-green-500"/> {t.privacyTitle}</h3>
        <p className="mb-4 text-slate-600 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: t.privacyIntro }}></p>
        <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg">
            <h4 className="font-semibold text-lg mb-2 text-slate-700 dark:text-slate-200 flex items-center"><DatabaseIcon className="h-5 w-5 mr-2 text-blue-500"/>{t.storageTitle}</h4>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2 text-sm">
                <li dangerouslySetInnerHTML={{ __html: t.storagePoint1 }} />
                <li dangerouslySetInnerHTML={{ __html: t.storagePoint2 }} />
                <li dangerouslySetInnerHTML={{ __html: t.storagePoint3 }} />
                <li dangerouslySetInnerHTML={{ __html: t.storagePoint4 }} />
            </ul>
             <button onClick={onOpenBackup} className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors">
                <UploadIcon className="h-5 w-5" />
                <span>{t.backupButton}</span>
            </button>
        </div>
    </div>
);

const TermsSection: React.FC<{ t: typeof translations['id'] }> = ({ t }) => (
    <div>
        <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white flex items-center"><FileTextIcon className="h-6 w-6 mr-2 text-yellow-500"/> {t.termsTitle}</h3>
        <div className="text-slate-600 dark:text-slate-300 space-y-3 text-sm">
            <p>{t.termsIntro}</p>
            <ul className="list-decimal list-inside bg-slate-100 dark:bg-slate-900 p-4 rounded-lg space-y-2">
                <li dangerouslySetInnerHTML={{ __html: t.termsPoint1 }} />
                <li dangerouslySetInnerHTML={{ __html: t.termsPoint2 }} />
                <li dangerouslySetInnerHTML={{ __html: t.termsPoint3 }} />
            </ul>
        </div>
    </div>
);

const CreditsSection: React.FC<{ t: typeof translations['id'] }> = ({ t }) => (
    <div>
        <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white flex items-center"><HeartIcon className="h-6 w-6 mr-2 text-pink-500"/> {t.creditsTitle}</h3>
        
        <div className="text-center mb-6">
            <p className="text-lg font-serif italic text-slate-700 dark:text-slate-300">
                {t.creditsQuran}
            </p>
        </div>

        <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <p dangerouslySetInnerHTML={{ __html: t.creditsPoweredBy }} />
            <p dangerouslySetInnerHTML={{ __html: t.creditsAssistedBy }} />
        </div>

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500 space-y-1">
            <p>{t.creditsCopyright}</p>
            <p>{t.creditsContact}</p>
        </div>
    </div>
);


export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, onOpenBackup }) => {
  const [activeTab, setActiveTab] = useState<Tab>('privacy');
  const [language, setLanguage] = useState<Language>('id');

  const t = translations[language];

  const renderContent = () => {
    switch (activeTab) {
      case 'privacy':
        return <PrivacySection t={t} onOpenBackup={onOpenBackup} />;
      case 'terms':
        return <TermsSection t={t} />;
      case 'credits':
        return <CreditsSection t={t} />;
      default:
        return null;
    }
  };
  
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-slate-50 dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col w-full md:w-1/4 bg-slate-100 dark:bg-slate-900/50 p-4 space-y-2 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700">
             <h2 className="text-xl font-bold text-slate-800 dark:text-white pb-2 mb-2 border-b border-slate-300 dark:border-slate-700">{t.title}</h2>
            <TabButton label={t.privacyTab} icon={<ShieldIcon className="h-5 w-5"/>} isActive={activeTab === 'privacy'} onClick={() => setActiveTab('privacy')} />
            <TabButton label={t.termsTab} icon={<FileTextIcon className="h-5 w-5"/>} isActive={activeTab === 'terms'} onClick={() => setActiveTab('terms')} />
            <TabButton label={t.creditsTab} icon={<HeartIcon className="h-5 w-5"/>} isActive={activeTab === 'credits'} onClick={() => setActiveTab('credits')} />
            <div className="flex-grow"></div>
            <button
              onClick={() => setLanguage(l => l === 'id' ? 'en' : 'id')}
              className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors w-full text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
            >
              <LanguageIcon className="h-5 w-5" />
              <span>{t.langToggle}</span>
            </button>
            <button onClick={onClose} className="p-2 w-10 h-10 self-center rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors md:hidden">
                <CloseIcon className="h-6 w-6 text-slate-500 dark:text-slate-400" />
            </button>
        </div>
        <div className="w-full md:w-3/4 p-6 overflow-y-auto relative">
           <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors hidden md:block">
                <CloseIcon className="h-6 w-6 text-slate-500 dark:text-slate-400" />
            </button>
           {renderContent()}
        </div>
      </div>
    </div>
  );
};