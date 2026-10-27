"use client";

import React, { useState, useEffect } from "react";
import {
  Scale,
  TrendingDown,
  TrendingUp,
  Plus,
  Check,
  History,
  Trash2,
  Calendar,
  Loader2,
  Database,
} from "lucide-react";
import { calculateBMI } from "@/lib/utils";
import { supabase, WeightLog } from "@/lib/supabase";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function WeightTracker() {
  const [weightInput, setWeightInput] = useState<string>("73.0");
  const [noteInput, setNoteInput] = useState<string>("");
  const [targetWeight, setTargetWeight] = useState<number>(68.0);
  const [height, setHeight] = useState<number>(172);
  const [currentWeight, setCurrentWeight] = useState<number>(73.0);
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. โหลดข้อมูลจริงจาก Supabase (user_profiles และ weight_logs)
  useEffect(() => {
    fetchWeightData();
  }, []);

  const fetchWeightData = async () => {
    setIsLoading(true);
    try {
      // ดึงเป้าหมายจาก user_profiles
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("height_cm, target_weight_kg, current_weight_kg")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (profile) {
        if (profile.height_cm) setHeight(Number(profile.height_cm));
        if (profile.target_weight_kg) setTargetWeight(Number(profile.target_weight_kg));
        if (profile.current_weight_kg) {
          setCurrentWeight(Number(profile.current_weight_kg));
          setWeightInput(String(profile.current_weight_kg));
        }
      }

      // ดึงประวัติน้ำหนักจริงจาก Supabase table `weight_logs`
      const { data: dbLogs, error } = await supabase
        .from("weight_logs")
        .select("*")
        .order("logged_date", { ascending: true });

      if (dbLogs && !error && dbLogs.length > 0) {
        setLogs(dbLogs);
        // เอาน้ำหนักล่าสุดจากแถวสุดท้าย
        const latest = dbLogs[dbLogs.length - 1];
        if (latest?.weight) {
          setCurrentWeight(Number(latest.weight));
          setWeightInput(String(latest.weight));
        }
      }
    } catch (err) {
      console.error("Fetch weight logs error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. บันทึกน้ำหนักใหม่ลง Supabase จริง 100%
  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(weightInput);
    if (!val || val < 30 || val > 250) return;

    setIsSaving(true);
    const todayStr = new Date().toISOString().split("T")[0];

    try {
      // เพิ่มแถวใหม่ในตาราง weight_logs
      const { error: logErr } = await supabase.from("weight_logs").insert({
        weight: val,
        logged_date: todayStr,
        note: noteInput.trim() || "ชั่งน้ำหนักประจำวัน",
      });

      if (logErr) throw logErr;

      // อัปเดต current_weight_kg ใน user_profiles
      await supabase
        .from("user_profiles")
        .update({
          current_weight_kg: val,
          updated_at: new Date().toISOString(),
        })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      setToastMessage(`บันทึกน้ำหนัก ${val} กก. ลงฐานข้อมูล Supabase สำเร็จแล้ว!`);
      setTimeout(() => setToastMessage(null), 3000);
      setNoteInput("");

      // รีเฟรชข้อมูลจริงจาก Supabase
      await fetchWeightData();
    } catch (err: any) {
      console.error("Save weight error:", err);
      alert("เกิดข้อผิดพลาดในการบันทึก: " + (err.message || "Unknown"));
    } finally {
      setIsSaving(false);
    }
  };

  // ลบรายการบันทึก
  const handleDeleteLog = async (id?: string) => {
    if (!id) return;
    try {
      await supabase.from("weight_logs").delete().eq("id", id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      await fetchWeightData();
    } catch (err) {
      console.error(err);
    }
  };

  const bmiInfo = calculateBMI(currentWeight, height);
  const diffFromTarget = (currentWeight - targetWeight).toFixed(1);

  // คำนวณผลต่างจากครั้งก่อนหน้า
  let diffFromPrev = 0;
  if (logs.length >= 2) {
    const latest = logs[logs.length - 1].weight;
    const prev = logs[logs.length - 2].weight;
    diffFromPrev = Number((latest - prev).toFixed(1));
  }

  // เตรียมข้อมูลกราฟ Chart.js จากข้อมูลจริงใน Supabase
  const chartLabels = logs.map((l) => {
    const d = new Date(l.logged_date);
    return `${d.getDate()} ${["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."][d.getMonth()]}`;
  });

  const chartData = {
    labels: chartLabels.length > 0 ? chartLabels : ["วันนี้"],
    datasets: [
      {
        label: "น้ำหนักจริง (กก.)",
        data: logs.length > 0 ? logs.map((l) => Number(l.weight)) : [currentWeight],
        borderColor: "#007AFF",
        backgroundColor: "rgba(0, 122, 255, 0.08)",
        borderWidth: 3,
        pointBackgroundColor: "#007AFF",
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.35,
        fill: true,
      },
      {
        label: `เป้าหมาย (${targetWeight} กก.)`,
        data: (chartLabels.length > 0 ? chartLabels : ["วันนี้"]).map(() => targetWeight),
        borderColor: "#34C759",
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          boxWidth: 10,
          font: { size: 11, family: "-apple-system, sans-serif" },
        },
      },
      tooltip: {
        backgroundColor: "rgba(28, 28, 30, 0.9)",
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        min: Math.floor(targetWeight - 3),
        max: Math.ceil(currentWeight + 4),
        ticks: { font: { size: 10 } },
        grid: { color: "rgba(0,0,0,0.04)" },
      },
      x: {
        ticks: { font: { size: 10 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="rounded-3xl bg-white p-5 shadow-ios border border-gray-100">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="mb-3 rounded-2xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow flex items-center space-x-1.5 animate-fade-in">
          <Check className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">บันทึกน้ำหนัก & BMI</h3>
            <p className="text-xs text-gray-500">
              {Number(diffFromTarget) > 0
                ? `เป้าหมายลดลงอีก ${diffFromTarget} กิโลกรัม`
                : "ยินดีด้วยครับ! บรรลุเป้าหมายน้ำหนักแล้ว 🎉"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <span className="flex items-center space-x-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
            <Database className="h-3 w-3 text-emerald-600" />
            <span>Supabase Live</span>
          </span>
        </div>
      </div>

      {/* สรุปน้ำหนักปัจจุบัน & ดัชนี BMI */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gray-50/80 p-3.5 border border-gray-100">
          <span className="text-[11px] font-medium text-gray-500">น้ำหนักล่าสุด</span>
          <div className="mt-1 flex items-baseline space-x-1">
            <span className="text-2xl font-black tracking-tight text-gray-900">{currentWeight}</span>
            <span className="text-xs text-gray-500 font-medium">กก.</span>
          </div>
          <div className="mt-1 flex items-center space-x-1 text-[11px] font-semibold">
            {diffFromPrev <= 0 ? (
              <span className="text-emerald-600 flex items-center space-x-0.5">
                <TrendingDown className="h-3 w-3" />
                <span>{diffFromPrev} กก. จากครั้งก่อน</span>
              </span>
            ) : (
              <span className="text-amber-600 flex items-center space-x-0.5">
                <TrendingUp className="h-3 w-3" />
                <span>+{diffFromPrev} กก. จากครั้งก่อน</span>
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-gray-50/80 p-3.5 border border-gray-100">
          <span className="text-[11px] font-medium text-gray-500">ดัชนี BMI (ส่วนสูง {height} ซม.)</span>
          <div className="mt-1 flex items-baseline space-x-1">
            <span className={`text-2xl font-black tracking-tight ${bmiInfo.color}`}>
              {bmiInfo.bmi}
            </span>
          </div>
          <span className="inline-block mt-1 text-[11px] font-semibold text-gray-700 truncate">
            {bmiInfo.category}
          </span>
        </div>
      </div>

      {/* กราฟแนวโน้มน้ำหนักจากข้อมูลจริง */}
      <div className="mt-4 h-48 w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin mr-1.5" />
            <span>กำลังดึงข้อมูลจริงจาก Supabase...</span>
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>

      {/* ฟอร์มกรอกน้ำหนักใหม่ */}
      <form onSubmit={handleLogWeight} className="mt-4 space-y-2">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="number"
              step="0.1"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder="กรอกน้ำหนักจริง เช่น 72.5"
              required
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
            <span className="absolute right-3.5 top-3 text-xs text-gray-400 font-semibold">กก.</span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center space-x-1.5 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-700 active:scale-95 transition disabled:opacity-50 flex-shrink-0"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>บันทึกน้ำหนัก</span>
              </>
            )}
          </button>
        </div>

        <input
          type="text"
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          placeholder="บันทึกข้อความสั้นๆ (เช่น ชั่งตอนเช้าหลังตื่นนอน)"
          className="w-full rounded-xl border border-gray-200 bg-gray-50/40 px-3.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-blue-400"
        />
      </form>

      {/* ปุ่มเปิดดูประวัติจริงใน Supabase */}
      <div className="mt-4 border-t border-gray-100 pt-3">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center space-x-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition"
        >
          <History className="h-3.5 w-3.5" />
          <span>
            {showHistory ? "ซ่อนประวัติย้อนหลัง" : `ดูประวัติทั้งหมด (${logs.length} ครั้งใน Supabase)`}
          </span>
        </button>

        {showHistory && (
          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
            {logs.slice().reverse().map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl bg-gray-50 p-2.5 px-3 text-xs border border-gray-100"
              >
                <div className="flex items-center space-x-2.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <div>
                    <span className="font-bold text-gray-800">{item.weight} กก.</span>
                    <span className="text-[10px] text-gray-400 ml-2">{item.logged_date}</span>
                    {item.note && (
                      <p className="text-[10px] text-gray-500 italic mt-0.5">{item.note}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteLog(item.id)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                  title="ลบรายการนี้"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
