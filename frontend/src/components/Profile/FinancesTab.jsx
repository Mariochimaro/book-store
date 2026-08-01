import { useState, useEffect } from "react";
import { authFetch } from "../../context/Apihelpers";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Activity,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PieChart
} from "lucide-react";

export default function FinancesTab() {
  const [finances, setFinances] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ვითხოვთ ორივე ენდფოინთს პარალელურად
    Promise.all([
      authFetch("/user/finances"),
      authFetch("/user/transactions")
    ])
      .then(([finData, transData]) => {
        setFinances(finData);
        setTransactions(transData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground opacity-50">
        <Activity className="w-6 h-6 animate-spin mr-2" />
        იტვირთება ფინანსური მონაცემები...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
        შეცდომა: {error}
      </div>
    );
  }

  // მონაცემების ამოღება Backend-დან
  const totalEarned = Number(finances?.total_earnings || 0);
  const booksSold = Number(finances?.books_sold_count || 0);
  const avgPrice = Number(finances?.average_price || 0);
  const activeListings = Number(finances?.active_listings_count || 0);

  // ყოველთვიური შემოსავლების დამუშავება
  // monthly_totals არის მასივი: [{"jan": 56}, {"feb": 22}]
  const rawMonths = finances?.monthly_totals || [];
  const monthsKeys = rawMonths.map((m) => Object.keys(m)[0]?.toUpperCase());
  const revenueByMonth = rawMonths.map((m) => Number(Object.values(m)[0]));
  
  const maxRev = revenueByMonth.length > 0 ? Math.max(...revenueByMonth) : 0;
  
  // თვიდან თვემდე ცვლილების (MoM) გამოთვლა
  const len = revenueByMonth.length;
  const thisMonthRevenue = len > 0 ? revenueByMonth[len - 1] : 0;
  const prevMonthRevenue = len > 1 ? revenueByMonth[len - 2] : 0;
  
  const monthChange = prevMonthRevenue > 0 
    ? ((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
    : 0;

  // ჟანრების პროცენტების დამუშავება
  const rawGenres = finances?.sales_by_genre_percentages || {};
  // ვაქცევთ მასივად, ვასორტირებთ კლებადობით და ვიღებთ ტოპ 4-ს
  const genresData = Object.entries(rawGenres)
    .map(([genre, pct]) => ({ genre, pct: Number(pct) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);

  // Payout კალკულაცია (შეგიძლია შეცვალო შენი პლატფორმის საკომისიოს მიხედვით)
  const platformFee = totalEarned * 0.08;
  const processingFee = totalEarned * 0.02;
  const netPayout = totalEarned - platformFee - processingFee;

  // KPI ბარათების კონფიგურაცია
  const kpis = [
    {
      label: "სულ შემოსავალი",
      value: `₾${totalEarned.toFixed(2)}`,
      sub: prevMonthRevenue > 0 ? `წინა თვესთან შედარებით` : `მიმდინარე შემოსავალი`,
      icon: DollarSign,
      change: monthChange,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "გაყიდული წიგნები",
      value: booksSold,
      sub: "ჯამური გაყიდვები",
      icon: TrendingUp,
      change: 0, // აქ შეგიძლია დინამიური გახადო, თუ ტრენდს ითვლი
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
    {
      label: "საშუალო ფასი",
      value: `₾${avgPrice.toFixed(2)}`,
      sub: "თითო წიგნზე",
      icon: BarChart3,
      change: 0,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "აქტიური განცხადებები",
      value: activeListings,
      sub: "ამჟამად იყიდება",
      icon: Activity,
      change: 0,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold">ფინანსური მიმოხილვა</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            შენი გაყიდვებისა და შემოსავლების დეტალური სტატისტიკა
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium">
          აქტიური გამყიდველი
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(({ label, value, sub, icon: Icon, change, color, bg }) => (
          <div key={label} className={`rounded-xl border p-4 ${bg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className={`text-2xl font-bold ${color} mb-1`}>{value}</div>
            <div className="flex items-center gap-1">
              {change !== 0 && (
                change > 0 ? (
                  <ChevronUp className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-destructive shrink-0" />
                )
              )}
              <span className="text-[10px] text-muted-foreground">
                {change !== 0 ? `${Math.abs(change).toFixed(1)}% ` : ""}
                {sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold">ყოველთვიური შემოსავალი</p>
              <p className="text-xs text-muted-foreground">ბოლო თვეების დინამიკა</p>
            </div>
            {len > 1 && (
              <div className={`flex items-center gap-1 ${monthChange >= 0 ? "text-emerald-400" : "text-destructive"}`}>
                {monthChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span className="text-xs font-semibold">{Math.abs(monthChange).toFixed(1)}% MoM</span>
              </div>
            )}
          </div>
          
          <div className="flex items-end gap-2 h-28 mt-4">
            {revenueByMonth.map((val, i) => {
              const isLast = i === revenueByMonth.length - 1;
              const barHeight = maxRev > 0 ? (val / maxRev) * 88 : 0;
              
              return (
                <div key={monthsKeys[i] + i} className="flex-1 flex flex-col items-center gap-1 group/bar">
                  <span className="text-[9px] text-muted-foreground opacity-0 group-hover/bar:opacity-100 transition-opacity">
                    ₾{val.toFixed(0)}
                  </span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${barHeight}px` }}
                    transition={{ duration: 0.6, delay: i * 0.07 }}
                    className={`w-full rounded-t transition-colors ${
                      isLast ? "bg-primary" : "bg-primary/40 hover:bg-primary/60"
                    }`}
                  />
                  <span className="text-[9px] text-muted-foreground">{monthsKeys[i]}</span>
                </div>
              );
            })}
            
            {revenueByMonth.length === 0 && (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                მონაცემები ჯერ არ არის
              </div>
            )}
          </div>
          
          <div className="flex justify-between mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
            <span>სულ: <span className="text-foreground font-semibold">₾{totalEarned.toFixed(2)}</span></span>
            <span>საშუალოდ თვეში: <span className="text-foreground font-semibold">
              ₾{len > 0 ? (totalEarned / len).toFixed(2) : "0.00"}
            </span></span>
          </div>
        </div>

        {/* Payout & Breakdown */}
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold">შემოსავლის განაწილება</p>
            </div>
            <div className="space-y-2">
              {[
                { label: "მთლიანი გამომუშავება", val: totalEarned, color: "text-foreground" },
                { label: "პლატფორმის საკომისიო (8%)", val: -platformFee, color: "text-destructive" },
                { label: "ტრანზაქციის საკომისიო (2%)", val: -processingFee, color: "text-destructive" },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={`font-medium ${color}`}>
                    {val < 0 ? "-" : ""}₾{Math.abs(val).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="my-2 h-[1px] bg-border w-full" />
              <div className="flex justify-between text-sm font-bold">
                <span>სუფთა შემოსავალი</span>
                <span className="text-emerald-400">₾{netPayout.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <PieChart className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold">გაყიდვები ჟანრების მიხედვით</p>
            </div>
            <div className="space-y-2">
              {genresData.length > 0 ? (
                genresData.map(({ genre, pct }, i) => {
                  const colors = ["bg-primary", "bg-blue-500", "bg-amber-500", "bg-purple-500"];
                  return (
                    <div key={genre}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-muted-foreground">{genre}</span>
                        <span className="font-medium">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: i * 0.1 }}
                          className={`h-full rounded-full ${colors[i % colors.length]}`}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground py-2 text-center">ჟანრების სტატისტიკა ცარიელია</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <p className="text-sm font-semibold">ტრანზაქციების ისტორია</p>
        </div>
        <div className="divide-y divide-border">
          {transactions.length > 0 ? (
            transactions.slice(0, 10).map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/10 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{tx.book_title}</p>
                    <p className="text-xs text-muted-foreground">მყიდველი: {tx.buyer_username}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-semibold text-emerald-400">+₾{Number(tx.price).toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(tx.datetime).toLocaleDateString("ka-GE")}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm flex flex-col items-center">
              <DollarSign className="w-8 h-8 mb-2 opacity-30" />
              ტრანზაქციები ჯერ არ მოიძებნა — დაამატე წიგნები გასაყიდად
            </div>
          )}
        </div>
      </div>
    </div>
  );
}