import React from 'react';

interface PieChartProps {
    data: Array<{
        id: string;
        name: string;
        value: number;
        color: string;
        icon: string;
    }>;
    total: number;
}

const PieChart: React.FC<PieChartProps> = ({ data, total }) => {
    // حساب النسب المتراكمة مقدماً
    const chartData = React.useMemo(() => {
        let cumulativePercentage = 0;
        return data.map(item => {
            const percentage = (item.value / total) * 100;
            const startPercentage = cumulativePercentage;
            cumulativePercentage += percentage;
            return {
                ...item,
                percentage,
                startPercentage
            };
        });
    }, [data, total]);

    const getPathData = (percentage: number, startPercentage: number) => {
        const radius = 80;
        const centerX = 100;
        const centerY = 100;
        
        const startAngle = (startPercentage * 360) / 100;
        const endAngle = ((startPercentage + percentage) * 360) / 100;
        
        const startAngleRad = (startAngle * Math.PI) / 180;
        const endAngleRad = (endAngle * Math.PI) / 180;
        
        const x1 = centerX + radius * Math.cos(startAngleRad);
        const y1 = centerY + radius * Math.sin(startAngleRad);
        const x2 = centerX + radius * Math.cos(endAngleRad);
        const y2 = centerY + radius * Math.sin(endAngleRad);
        
        const largeArcFlag = percentage > 50 ? 1 : 0;
        
        return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    };

    return (
        <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 text-center">توزيع المصاريف حسب الفئات</h3>
            
            <div className="flex flex-col lg:flex-row items-center gap-8">
                {/* الرسم البياني الدائري */}
                <div className="flex-shrink-0">
                    <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
                        {chartData.map((item) => (
                            <path
                                key={item.id}
                                d={getPathData(item.percentage, item.startPercentage)}
                                fill={item.color}
                                stroke="rgba(255, 255, 255, 0.1)"
                                strokeWidth="1"
                                className="hover:opacity-80 transition-opacity duration-300"
                            />
                        ))}
                    </svg>
                </div>

                {/* مفتاح الألوان */}
                <div className="flex-1 space-y-3">
                    {chartData.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                            <div 
                                className="w-4 h-4 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-2xl">{item.icon}</span>
                            <div className="flex-1">
                                <div className="text-white font-semibold">{item.name}</div>
                                <div className="text-blue-200 text-sm">{item.percentage.toFixed(1)}%</div>
                            </div>
                            <div className="text-white font-bold">
                                {item.value.toLocaleString()} ريال
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PieChart;


