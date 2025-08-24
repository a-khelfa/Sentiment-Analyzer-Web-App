import React, { useState, useEffect } from 'react';
import { BiHappyHeartEyes, BiSad, BiMeh, BiChevronDown, BiChevronUp, BiShareAlt, BiCopy } from 'react-icons/bi';
import { LuLoader2 } from "react-icons/lu";

// Importations Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, addDoc, collection, query, onSnapshot, getDocs, deleteDoc, getDoc } from 'firebase/firestore';

// Composant pour un élément d'historique.
const HistoryItem = ({ item, onShare }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Fonction utilitaire pour déterminer l'icône et la couleur en fonction du sentiment.
    const getSentimentIconAndColor = (sentiment) => {
        let icon, color, label;
        switch (sentiment.toLowerCase()) {
            case 'positif':
                icon = <BiHappyHeartEyes className="w-8 h-8 md:w-10 md:h-10 text-emerald-500" />;
                color = 'text-emerald-500';
                label = 'Positif';
                break;
            case 'négatif':
                icon = <BiSad className="w-8 h-8 md:w-10 md:h-10 text-red-500" />;
                color = 'text-red-500';
                label = 'Négatif';
                break;
            case 'neutre':
            default:
                icon = <BiMeh className="w-8 h-8 md:w-10 md:h-10 text-yellow-500" />;
                color = 'text-yellow-500';
                label = 'Neutre';
                break;
        }
        return { icon, color, label };
    };

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };
    
    const { icon, color, label } = getSentimentIconAndColor(item.sentiment);

    return (
        <div className={`bg-gray-100 dark:bg-gray-700 rounded-xl p-4 shadow-md transition-all duration-300 transform hover:scale-[1.01] ${isExpanded ? 'border-2 border-blue-500' : ''}`}>
            <div className="flex items-center justify-between cursor-pointer" onClick={toggleExpanded}>
                <div className="flex items-center space-x-3">
                    {icon}
                    <div>
                        <span className={`font-semibold ${color}`}>{label}</span>
                        <p className="text-gray-500 dark:text-gray-400 text-sm truncate max-w-[200px] md:max-w-none">{item.text.length > 50 ? item.text.substring(0, 47) + '...' : item.text}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onShare(item);
                        }}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Partager"
                    >
                        <BiShareAlt className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                    {isExpanded ? (
                        <BiChevronUp className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    ) : (
                        <BiChevronDown className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    )}
                </div>
            </div>
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.explanation}</p>
                </div>
            )}
        </div>
    );
};

// Composant pour la modale de partage.
const ShareModal = ({ shareUrl, onClose, isSharing }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        const tempInput = document.createElement('input');
        tempInput.value = shareUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 w-full max-w-sm shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">
                    Partager l'analyse
                </h2>
                {isSharing ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-8">
                        <LuLoader2 className="animate-spin w-8 h-8 text-blue-500" />
                        <span className="text-gray-500 dark:text-gray-400">Génération du lien...</span>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                            Copiez ce lien pour partager votre analyse.
                        </p>
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={shareUrl}
                                readOnly
                                className="flex-grow p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <button
                                onClick={handleCopy}
                                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                <BiCopy className="w-5 h-5" />
                            </button>
                        </div>
                        {isCopied && (
                            <p className="text-green-500 dark:text-green-400 text-sm mt-2 text-center">Lien copié !</p>
                        )}
                        <div className="flex justify-center mt-6">
                            <button
                                onClick={onClose}
                                className="w-full md:w-auto px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-xl transition-all"
                            >
                                Fermer
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};


// Composant pour la vue partagée.
const SharedAnalysisView = ({ db, sharedId }) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fonction utilitaire pour déterminer l'icône et la couleur en fonction du sentiment.
    const getSentimentIconAndColor = (sentiment) => {
        let icon, color, label;
        switch (sentiment.toLowerCase()) {
            case 'positif':
                icon = <BiHappyHeartEyes className="w-12 h-12 text-emerald-500" />;
                color = 'text-emerald-500';
                label = 'Positif';
                break;
            case 'négatif':
                icon = <BiSad className="w-12 h-12 text-red-500" />;
                color = 'text-red-500';
                label = 'Négatif';
                break;
            case 'neutre':
            default:
                icon = <BiMeh className="w-12 h-12 text-yellow-500" />;
                color = 'text-yellow-500';
                label = 'Neutre';
                break;
        }
        return { icon, color, label };
    };

    useEffect(() => {
        if (!db || !sharedId) {
            setError("Lien de partage invalide ou base de données non prête.");
            setIsLoading(false);
            return;
        }

        const fetchSharedData = async () => {
            try {
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const docRef = doc(db, `artifacts/${appId}/public/data/sharedAnalyses`, sharedId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setData(docSnap.data());
                } else {
                    setError("Analyse introuvable.");
                }
            } catch (err) {
                console.error("Erreur lors de la récupération du document partagé:", err);
                setError("Une erreur s'est produite lors du chargement de l'analyse.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSharedData();
    }, [db, sharedId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LuLoader2 className="animate-spin w-12 h-12 text-blue-500 mr-2" />
                <span className="text-gray-500 dark:text-gray-400 text-lg">Chargement de l'analyse...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mt-4 max-w-2xl mx-auto my-8">
                <span className="block sm:inline">{error}</span>
            </div>
        );
    }

    if (!data) {
        return <div className="text-center text-gray-500 dark:text-gray-400 text-lg mt-8">Analyse introuvable.</div>;
    }

    const { icon, color, label } = getSentimentIconAndColor(data.sentiment);

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center p-4 antialiased">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 max-w-2xl w-full">
                <div className="flex flex-col items-center mb-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white text-center mb-2">
                        Analyse partagée
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-center text-sm md:text-base">
                        Vue d'une analyse de sentiment partagée par un autre utilisateur.
                    </p>
                </div>
                <div className="mt-6 p-6 rounded-xl border-2 border-gray-300 dark:border-gray-700">
                    <div className="flex items-center space-x-4 mb-4">
                        {icon}
                        <h3 className={`text-2xl font-semibold ${color}`}>
                            Sentiment : {label}
                        </h3>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">Texte original :</p>
                        <p className="text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">{data.text}</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">Explication :</p>
                        <p className="text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">{data.explanation}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};


// Le composant principal de l'application.
const App = () => {
    const [text, setText] = useState('');
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [isSharing, setIsSharing] = useState(false);
    
    // Nouveaux états pour le routage simple
    const [isSharedView, setIsSharedView] = useState(false);
    const [sharedId, setSharedId] = useState(null);

    // Initialisation de Firebase et gestion de l'authentification.
    useEffect(() => {
        try {
            const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
            if (!firebaseConfig) {
                console.error("Firebase config is not available.");
                setError("La configuration Firebase est manquante.");
                return;
            }

            const app = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(app);
            const authInstance = getAuth(app);
            setDb(firestoreDb);
            setAuth(authInstance);

            const handleAuth = async () => {
                const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(authInstance, initialAuthToken);
                    } else {
                        await signInAnonymously(authInstance);
                    }
                } catch (err) {
                    console.error("Authentication error:", err);
                    setError("Erreur d'authentification. Veuillez réessayer.");
                }
            };

            const unsubscribe = onAuthStateChanged(authInstance, (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    setUserId(null);
                }
            });

            handleAuth();

            return () => unsubscribe();

        } catch (err) {
            console.error("Firebase initialization error:", err);
            setError("Erreur lors de l'initialisation de l'application.");
        }
    }, []);

    // Charger l'historique depuis Firestore.
    useEffect(() => {
        if (db && userId) {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const historyRef = collection(db, `artifacts/${appId}/users/${userId}/analyses`);
            const q = query(historyRef);

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedHistory = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).sort((a, b) => b.timestamp - a.timestamp);
                
                setHistory(fetchedHistory);
                setIsHistoryLoading(false);
            }, (err) => {
                console.error("Error fetching history from Firestore:", err);
                setError("Erreur lors du chargement de l'historique.");
                setIsHistoryLoading(false);
            });

            return () => unsubscribe();
        }
    }, [db, userId]);
    
    // Gérer le routage basé sur le hachage d'URL
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.substring(1); // Supprimer le '#'
            if (hash.startsWith('share/')) {
                const id = hash.split('/')[1];
                setSharedId(id);
                setIsSharedView(true);
            } else {
                setIsSharedView(false);
                setSharedId(null);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Appeler au montage initial

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const handleTextChange = (e) => {
        setText(e.target.value);
        setError(null);
    };

    const handleAnalyze = async () => {
        if (text.trim() === '') {
            setError("Veuillez saisir du texte à analyser.");
            setResult(null);
            return;
        }
        
        if (!userId) {
            setError("Utilisateur non authentifié. Veuillez patienter.");
            return;
        }

        setIsLoading(true);
        setError(null);
        
        const generationConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    "sentiment": { "type": "STRING" },
                    "explanation": { "type": "STRING" }
                },
                "propertyOrdering": ["sentiment", "explanation"]
            }
        };

        const chatHistory = [{
            role: "user",
            parts: [{
                text: `Analysez le sentiment du texte suivant et fournissez une explication. Le sentiment doit être classé comme 'positif', 'négatif' ou 'neutre'.\nTexte: "${text}"`
            }]
        }];

        const payload = {
            contents: chatHistory,
            generationConfig: generationConfig
        };

        const apiKey = "";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Erreur API: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
                const jsonText = data.candidates[0].content.parts[0].text;
                const parsedJson = JSON.parse(jsonText);
                
                setResult(parsedJson);

                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                await addDoc(collection(db, `artifacts/${appId}/users/${userId}/analyses`), {
                    ...parsedJson,
                    text: text,
                    timestamp: Date.now()
                });

            } else {
                setError("La réponse de l'API est vide ou a un format inattendu.");
            }

        } catch (err) {
            console.error('Erreur lors de l\'analyse du sentiment:', err);
            setError("Une erreur s'est produite lors de l'analyse. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = async () => {
        setText('');
        setResult(null);
        setError(null);
        
        if (db && userId) {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const historyRef = collection(db, `artifacts/${appId}/users/${userId}/analyses`);
            const q = query(historyRef);
            
            try {
                const snapshot = await getDocs(q);
                const deletePromises = snapshot.docs.map(docToDelete => deleteDoc(doc(db, historyRef.path, docToDelete.id)));
                await Promise.all(deletePromises);
                console.log("History cleared successfully from Firestore.");
            } catch (err) {
                console.error("Error clearing history from Firestore:", err);
                setError("Erreur lors de la suppression de l'historique.");
            }
        }
    };

    const handleShare = async (item) => {
        if (!db) {
            setError("La base de données n'est pas prête.");
            return;
        }

        setShowShareModal(true);
        setIsSharing(true);
        setShareUrl('');

        try {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const publicCollectionRef = collection(db, `artifacts/${appId}/public/data/sharedAnalyses`);
            const docRef = await addDoc(publicCollectionRef, {
                sentiment: item.sentiment,
                explanation: item.explanation,
                text: item.text,
                originalUserId: userId,
                timestamp: Date.now()
            });

            const shareableLink = `${window.location.origin}${window.location.pathname}#share/${docRef.id}`;
            setShareUrl(shareableLink);

        } catch (err) {
            console.error("Error sharing document:", err);
            setError("Une erreur s'est produite lors du partage.");
            setShowShareModal(false);
        } finally {
            setIsSharing(false);
        }
    };

    const closeShareModal = () => {
        setShowShareModal(false);
    };
    
    // Fonction utilitaire pour déterminer l'icône et la couleur en fonction du sentiment.
    const getSentimentIconAndColor = (sentiment) => {
        let icon, color, label;
        switch (sentiment.toLowerCase()) {
            case 'positif':
                icon = <BiHappyHeartEyes className="w-8 h-8 md:w-10 md:h-10 text-emerald-500" />;
                color = 'text-emerald-500';
                label = 'Positif';
                break;
            case 'négatif':
                icon = <BiSad className="w-8 h-8 md:w-10 md:h-10 text-red-500" />;
                color = 'text-red-500';
                label = 'Négatif';
                break;
            case 'neutre':
            default:
                icon = <BiMeh className="w-8 h-8 md:w-10 md:h-10 text-yellow-500" />;
                color = 'text-yellow-500';
                label = 'Neutre';
                break;
        }
        return { icon, color, label };
    };
    
    // Rendu conditionnel basé sur la vue.
    if (isSharedView) {
        return <SharedAnalysisView db={db} sharedId={sharedId} />;
    }

    // Vue principale de l'application
    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 antialiased">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 max-w-2xl w-full my-8">
                {userId && (
                    <div className="text-center text-sm text-gray-400 dark:text-gray-500 mb-4 break-words">
                        ID utilisateur: {userId}
                    </div>
                )}
                <div className="flex flex-col items-center mb-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white text-center mb-2">
                        Analyseur de Sentiment
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-center text-sm md:text-base">
                        Saisissez du texte ci-dessous et cliquez sur "Analyser" pour déterminer son sentiment.
                    </p>
                </div>

                <div className="mb-6">
                    <textarea
                        value={text}
                        onChange={handleTextChange}
                        placeholder="Saisissez votre texte ici..."
                        rows="8"
                        className="w-full p-4 text-base md:text-lg border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    ></textarea>
                </div>

                <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !userId}
                        className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center space-x-2">
                                <LuLoader2 className="animate-spin" />
                                <span>Analyse...</span>
                            </div>
                        ) : (
                            'Analyser le sentiment'
                        )}
                    </button>
                    <button
                        onClick={handleClear}
                        className="w-full md:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                        Effacer tout
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mt-4">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {result && (
                    <div className="mt-6 p-4 rounded-xl border-2 border-gray-300 dark:border-gray-700">
                        <div className="flex items-center space-x-4 mb-2">
                            {getSentimentIconAndColor(result.sentiment).icon}
                            <h3 className={`text-xl font-semibold ${getSentimentIconAndColor(result.sentiment).color}`}>
                                Sentiment : {getSentimentIconAndColor(result.sentiment).label}
                            </h3>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{result.explanation}</p>
                    </div>
                )}

                <div className="mt-8">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                        Historique des analyses
                    </h2>
                    {isHistoryLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <LuLoader2 className="animate-spin w-8 h-8 text-blue-500 mr-2" />
                            <span className="text-gray-500 dark:text-gray-400">Chargement de l'historique...</span>
                        </div>
                    ) : (
                        history.length > 0 ? (
                            <div className="space-y-4">
                                {history.map((item) => (
                                    <HistoryItem key={item.id} item={item} onShare={handleShare} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 dark:text-gray-400">
                                L'historique des analyses sera affiché ici.
                            </div>
                        )
                    )}
                </div>
            </div>
            {showShareModal && (
                <ShareModal
                    shareUrl={shareUrl}
                    onClose={closeShareModal}
                    isSharing={isSharing}
                />
            )}
        </div>
    );
};

export default App;
