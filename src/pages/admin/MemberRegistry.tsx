import React, { useEffect, useMemo, useState } from "react";
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
  <div className="border border-white/20 rounded-xl p-6">
    <p className="font-silkscreen text-white text-lg mb-4">
      {title}
    </p>
    <div className="w-full h-[260px]">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={90}
            label
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
        <div className="flex items-center justify-center mt-[20vh]">
          <p className="font-silkscreen text-[1.25rem] text-white">
            Loading...
          </p>
        </div>
      </>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <>
      <Header />

      <PageTitle
        image="/theme/title_icon.png"
        title="Member Registry"
        className="mt-[5vh]"
      />

      <div className="px-[6vw] pb-24 text-white">
        {/* TOTAL */}
        <p className="font-silkscreen text-2xl mb-6">
          Total Members: {members.length}
        </p>

        {/* CHARTS */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
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
          className="mb-6 w-full p-3 rounded-lg bg-transparent border border-white/30 outline-none"
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* LIST */}
        <div className="border border-white/20 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/10">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th>Email</th>
                <th>University</th>
                <th>Degree</th>
                <th>Majors</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, idx) => (
                <tr
                  key={`${m.student_id}-${idx}`}
                  className="border-t border-white/10 text-center"
                >
                  <td className="p-3 text-left">
                    {m.first_name} {m.last_name}
                  </td>
                  <td>{m.email}</td>
                  <td>{m.university}</td>
                  <td>{m.degrees.join(", ")}</td>
                  <td>
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
