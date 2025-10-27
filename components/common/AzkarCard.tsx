import React, { useState, useEffect } from 'react';

interface AzkarCardProps {
    darkMode?: boolean;
}

const AzkarCard: React.FC<AzkarCardProps> = ({ darkMode = false }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentZikr, setCurrentZikr] = useState(0);

    // الأذكار الصباحية (10)
    const morningAzkar = [
        "أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير",
        "اللهم بك أصبحنا، وبك أمسينا، وبك نحيا، وبك نموت، وإليك النشور",
        "اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك علي وأبوء بذنبي فاغفر لي فإنه لا يغفر الذنوب إلا أنت",
        "اللهم إني أصبحت أشهدك وأشهد حملة عرشك وملائكتك وجميع خلقك أنك أنت الله لا إله إلا أنت وحدك لا شريك لك وأن محمداً عبدك ورسولك",
        "اللهم ما أصبح بي من نعمة أو بأحد من خلقك فمنك وحدك لا شريك لك، فلك الحمد ولك الشكر",
        "اللهم عافني في بدني، اللهم عافني في سمعي، اللهم عافني في بصري، لا إله إلا أنت",
        "أعوذ بكلمات الله التامات من شر ما خلق",
        "بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم",
        "حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم",
        "سبحان الله وبحمده عدد خلقه ورضا نفسه وزنة عرشه ومداد كلماته"
    ];

    // أذكار عامة للمنتصف (12 ظهراً حتى 5 مساءً) (10)
    const middayAzkar = [
        "سبحان الله",
        "الحمد لله",
        "لا إله إلا الله",
        "الله أكبر",
        "لا حول ولا قوة إلا بالله",
        "أستغفر الله وأتوب إليه",
        "سبحان الله وبحمده",
        "سبحان الله العظيم",
        "اللهم صل وسلم على نبينا محمد",
        "حسبي الله ونعم الوكيل"
    ];

    // الأذكار المسائية (من 5 مساءً حتى 12 ليلاً، وتمتد حتى 3 فجراً)
    const eveningAzkar = [
        "أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير",
        "اللهم بك أمسينا، وبك أصبحنا، وبك نحيا، وبك نموت، وإليك المصير",
        "اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك علي وأبوء بذنبي فاغفر لي فإنه لا يغفر الذنوب إلا أنت",
        "اللهم إني أمسيت أشهدك وأشهد حملة عرشك وملائكتك وجميع خلقك أنك أنت الله لا إله إلا أنت وحدك لا شريك لك وأن محمداً عبدك ورسولك",
        "اللهم ما أمسى بي من نعمة أو بأحد من خلقك فمنك وحدك لا شريك لك، فلك الحمد ولك الشكر",
        "اللهم إني أسألك العفو والعافية",
        "رضيت بالله رباً وبالإسلام ديناً وبمحمد صلى الله عليه وسلم نبياً",
        "أعوذ بكلمات الله التامات من شر ما خلق",
        "بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم",
        "حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم"
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentZikr(prev => (prev + 1) % getCurrentAzkar().length);
        }, 10000); // تغيير الذكر كل 10 ثوان

        return () => clearInterval(interval);
    }, []);

    const getCurrentAzkar = () => {
        const hour = currentTime.getHours();
        if (hour >= 3 && hour < 12) return morningAzkar; // 3 صباحاً - 12 ظهراً
        if (hour >= 12 && hour < 17) return middayAzkar; // 12 ظهراً - 5 مساءً
        // 5 مساءً - 12 ليلاً، وكذلك من 12 ليلاً حتى 3 فجراً
        return eveningAzkar;
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour >= 3 && hour < 12) return "صباح الخير";
        if (hour >= 12 && hour < 17) return "مرحباً";
        return "مساء الخير";
    };

    const getTimeOfDay = () => {
        const hour = currentTime.getHours();
        if (hour >= 3 && hour < 12) return "الصباح";
        if (hour >= 12 && hour < 17) return ""; // عنوان عام: "أذكار"
        return "المساء";
    };

    const currentAzkar = getCurrentAzkar();

    return (
        <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center">
                    <span className="text-2xl">🌅</span>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">{getTimeOfDay() ? `أذكار ${getTimeOfDay()}` : 'أذكار'}</h3>
                    <p className="text-blue-200 text-sm">{getGreeting()}، {currentTime.toLocaleTimeString('ar-SA')}</p>
                </div>
            </div>
            
            <div className="bg-gradient-to-r from-slate-700/50 to-blue-800/50 rounded-xl p-4 border border-blue-400/10">
                <p className="text-white text-sm leading-relaxed text-right">
                    {currentAzkar[currentZikr]}
                </p>
            </div>
            
            <div className="flex justify-between items-center mt-4">
                <div className="flex gap-1">
                    {currentAzkar.map((_, index) => (
                        <div 
                            key={index} 
                            className={`w-2 h-2 rounded-full ${
                                index === currentZikr ? 'bg-cyan-400' : 'bg-slate-600'
                            }`}
                        />
                    ))}
                </div>
                <p className="text-blue-300 text-xs">
                    {currentZikr + 1} من {currentAzkar.length}
                </p>
            </div>
        </div>
    );
};

export default AzkarCard;

