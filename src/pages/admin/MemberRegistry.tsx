import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { PageTitle } from "../../components/PageTitle";
import { useAdminDashboard } from "../../lib/adminDashboardController";

import {
  fetchMemberRegistry,
  groupBy,
  mapYearLevel,
  MemberRow,
} from "../../lib/memberRegistryController";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#6E80DA", "#FF8C42", "#4CAF50", "#E91E63", "#00BCD4"];

const PieCard = ({
  title,
  data,
}: {
  title: string;
  data: { name: string; value: number }[];
}) => (
  <div className="border border-white/20 rounded-xl p-4 sm:p-6 min-w-0">
    <p className="font-silkscreen text-white text-base sm:text-lg mb-4">
      {title}
    </p>
    <div className="w-full h-[220px] sm:h-[280px] min-h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius="75%"
            cx="50%"
            cy="50%"
            label={({ name, percent }) => (percent != null && percent >= 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : null)}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={COLORS[i % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const MemberRegistry: React.FC = () => {
  const { loading, authorized } = useAdminDashboard();

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loading || !authorized || loaded) return;

    fetchMemberRegistry()
      .then((data) => {
        setMembers(data);
        setLoaded(true);
      })
      .catch(console.error);
  }, [loading, authorized, loaded]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return members.filter(
      (m) =>
        m.first_name.toLowerCase().includes(q) ||
        m.last_name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [members, search]);

  const yearLevelData = useMemo(() => {
    const map = new Map<string, number>();

    for (const m of members) {
      const label = mapYearLevel(m.university_year);
      map.set(label, (map.get(label) ?? 0) + 1);
    }

    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [members]);

  if (loading) {
    return (
      <>
        <Header />
        <PageTitle title="Member Registry" className="mt-[5vh]" />
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="font-silkscreen text-[1.25rem] text-white">
            Loading...
          </p>
        </div>
        <Footer />
      </>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="px-[8vw] pt-4 sm:pt-6">
        <Link
          to="/admin/dashboard"
          className="font-silkscreen text-sm sm:text-base text-white/80 hover:text-white py-2 touch-manipulation w-fit"
        >
          ← Back to dashboard
        </Link>
      </div>

      <PageTitle
        title="Member Registry"
        className="mt-[5vh]"
      />

      <div className="px-4 sm:px-6 lg:px-[6vw] pb-12 sm:pb-24 text-white max-w-full min-w-0">
        {/* TOTAL */}
        <p className="font-silkscreen text-xl sm:text-2xl mb-6">
          Total Members: {members.length}
        </p>

        {/* CHARTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <PieCard
            title="Universities"
            data={groupBy(members, "university")}
          />
          <PieCard
            title="Degrees"
            data={groupBy(members, "degrees")}
          />
          <PieCard
            title="Majors"
            data={groupBy(members, "majors")}
          />
          <PieCard
            title="Year Level"
            data={yearLevelData}
          />
        </div>

        {/* SEARCH */}
        <input
          placeholder="Search members..."
          className="pixel-input font-pixelify mb-6 w-full min-h-[44px] touch-manipulation"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* LIST */}
        <div className="border border-white/20 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-white/10">
              <tr>
                <th className="p-3 text-left font-silkscreen">Name</th>
                <th className="p-3 text-left sm:text-center font-silkscreen">Email</th>
                <th className="p-3 text-left sm:text-center font-silkscreen">University</th>
                <th className="p-3 text-left sm:text-center font-silkscreen">Degree</th>
                <th className="p-3 text-left sm:text-center font-silkscreen">Majors</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, idx) => (
                <tr
                  key={`${m.student_id}-${idx}`}
                  className="border-t border-white/10"
                >
                  <td className="p-3 text-left font-pixelify">
                    {m.first_name} {m.last_name}
                  </td>
                  <td className="p-3 text-left sm:text-center font-pixelify break-all">{m.email}</td>
                  <td className="p-3 text-left sm:text-center font-pixelify">{m.university}</td>
                  <td className="p-3 text-left sm:text-center font-pixelify">{m.degrees.join(", ")}</td>
                  <td className="p-3 text-left sm:text-center font-pixelify">
                    {m.majors?.length
                      ? m.majors.join(", ")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default MemberRegistry;
