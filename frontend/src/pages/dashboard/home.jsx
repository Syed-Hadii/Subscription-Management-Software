import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Chip,
  IconButton,
  Spinner,
} from "@material-tailwind/react";
import {
  UsersIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  EnvelopeIcon,
  RectangleStackIcon,
  UserGroupIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import axios from 'axios';
import { StatisticsCard } from "@/widgets/cards";
import { StatisticsChart } from "@/widgets/charts";
import { chartsConfig } from "@/configs";
import { API } from '@/configs/base-url';

const DASHBOARD_API = `http://93.127.216.35:5000/dashboard`;

export function Home() {
  const [range, setRange] = useState("MONTH");
  const [kpis, setKpis] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState({
    day: { categories: [], series: [{ name: 'Payments', data: [] }] },
    week: { categories: [], series: [{ name: 'Payments', data: [] }] },
    month: { categories: [], series: [{ name: 'Payments', data: [] }] },
  });
  const [recentSubscriptions, setRecentSubscriptions] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
const [loading, setLoading] = useState(false);
// Define KPI configurations
  const kpiConfig = {
    "Active Subscriptions": {
      color: "blue",
      icon: "UsersIcon",
      footer: { color: "text-green-500", value: "+5%", label: "than last month" },
    },
    "Outstanding Invoices": {
      color: "red",
      icon: "BanknotesIcon",
      footer: { color: "text-red-500", value: "-2%", label: "than last month" },
    },
    "Paid This Month": {
      color: "green",
      icon: "CurrencyDollarIcon",
      footer: { color: "text-green-500", value: "+10%", label: "than last month" },
    },
    MRR: {
      color: "purple",
      icon: "ArrowTrendingUpIcon",
      footer: { color: "text-green-500", value: "+3%", label: "than last month" },
    },
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${DASHBOARD_API}/data`);
        const { kpis, paymentHistory, recentSubscriptions, recentInvoices } = response.data;
        console.log('Fetched dashboard data:', response.data);
        // Map backend KPIs to include color, icon, and footer
        const enrichedKpis = kpis.map(kpi => ({
          ...kpi,
          ...kpiConfig[kpi.title],
        }));

        setKpis(enrichedKpis);
        setPaymentHistory(paymentHistory);
        setRecentSubscriptions(recentSubscriptions);
        setRecentInvoices(recentInvoices);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const chartData = useMemo(() => {
    if (range === "DAY") return paymentHistory.day;
    if (range === "WEEK") return paymentHistory.week;
    return paymentHistory.month;
  }, [range, paymentHistory]);

  const rangeBtn = (label, key) => (
    <Button
      key={key}
      size="sm"
      variant={range === key ? "filled" : "outlined"}
      color={range === key ? "black" : "blue-gray"}
      onClick={() => setRange(key)}
      className="rounded-md"
    >
      {label}
    </Button>
  );

  const removeInvoice = async (invoiceId) => {
    try {
      await axios.put(`${DASHBOARD_API}/invoices/${invoiceId}/remove`);
      setRecentInvoices((prev) => prev.filter((inv) => inv.no !== invoiceId));
    } catch (err) {
      console.error('Error removing invoice:', err);
    }
  };

  return (
    <div className="mt-12">
      {loading ? (
              <div className="flex items-center justify-center py-20">
                <Spinner className="h-10 w-10 text-blue-600" />
              </div>
            ) : (
          <>
              {/* KPIs */}
      <div className="mb-12 grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ icon, title, value, color, footer }) => (
          <div key={title}>
            <StatisticsCard
              title={title}
              value={value}
              color={color}
              icon={
                <div className="rounded-lg bg-black p-3">
                  {React.createElement(
                    { UsersIcon, BanknotesIcon, CurrencyDollarIcon, ArrowTrendingUpIcon }[icon],
                    { className: "w-6 h-6 text-white" }
                  )}
                </div>
              }
              footer={
                <Typography className="font-normal text-blue-gray-600">
                  <span className={`${footer.color} font-semibold`}>{footer.value}</span>
                  &nbsp;{footer.label}
                </Typography>
              }
            />
          </div>
        ))}
      </div>

      {/* Row 2: Payment History | Recent Subscriptions */}
      <div className="mb-10 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Payment History */}
        <Card className="xl:col-span-2 border border-blue-gray-100 shadow-sm">
          <CardHeader floated={false} shadow={false} color="transparent" className="m-0 flex items-center justify-between p-6">
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-1">
                Payment History
              </Typography>
              <Typography variant="small" className="flex items-center gap-1 font-normal text-blue-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 text-blue-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Last {range === "DAY" ? "7 days" : range === "WEEK" ? "5 weeks" : "12 months"}
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              {rangeBtn("Day", "DAY")}
              {rangeBtn("Week", "WEEK")}
              {rangeBtn("Month", "MONTH")}
            </div>
          </CardHeader>
          <CardBody className="pt-4">
            <StatisticsChart
              color="white"
              chart={{
                type: "line",
                height: 300,
                series: chartData.series,
                options: {
                  ...chartsConfig,
                  chart: {
                    animations: { enabled: true, easing: "easeinout", speed: 700 },
                    toolbar: { show: false },
                    background: "#ffffff",
                    foreColor: "#334155",
                  },
                  colors: ["#2196F3"],
                  fill: { type: "solid" },
                  stroke: { curve: "straight", width: 3 },
                  dataLabels: { enabled: false },
                  xaxis: {
                    categories: chartData.categories,
                    labels: { style: { colors: "#334155", fontSize: "12px" } },
                    axisBorder: { show: false },
                    axisTicks: { show: false },
                  },
                  yaxis: {
                    tickAmount: 6,
                    labels: {
                      style: { colors: "#334155", fontSize: "12px" },
                      formatter: function (val) {
                        return val.toFixed(0);
                      },
                    },
                    min: 0,
                    max: Math.max(...chartData.series[0].data, 600) || 600,
                  },
                  grid: {
                    borderColor: "#e0e0e0",
                    strokeDashArray: 5,
                    xaxis: { lines: { show: true } },
                    yaxis: { lines: { show: true } },
                    padding: { top: 0, right: 20, bottom: 0, left: 20 },
                  },
                  markers: {
                    size: 6,
                    colors: ["#2196F3"],
                    strokeColors: "#ffffff",
                    strokeWidth: 2,
                    hover: { sizeOffset: 4 },
                  },
                  tooltip: { theme: "light" },
                },
              }}
              title=""
              description=""
              footer={
                <Typography variant="small" className="text-blue-gray-600">
                  Collections trend this {range.toLowerCase()} looks healthy.
                </Typography>
              }
            />
          </CardBody>
        </Card>

        {/* Recent Subscriptions */}
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardHeader floated={false} shadow={false} color="transparent" className="m-0 p-6">
            <Typography variant="h6" color="blue-gray" className="mb-2">
              Recent Subscriptions
            </Typography>
            <Typography variant="small" className="text-blue-gray-600">
              Newly started / changed plans
            </Typography>
          </CardHeader>
          <CardBody className="overflow-x-auto pt-0">
            <table className="w-full min-w-[520px] table-auto">
              <thead>
                <tr>
                  {["Client", "Plan", "Price", "Start", "Status"].map((h) => (
                    <th key={h} className="border-b border-blue-gray-50 px-4 py-3 text-left">
                      <Typography variant="small" className="font-medium text-blue-gray-600">{h}</Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentSubscriptions.map(({ client, plan, price, start, status }) => (
                  <tr key={`${client}-${plan}`}>
                    <td className="border-b border-blue-gray-50 px-4 py-3">
                      <Typography variant="small" className="font-normal">{client}</Typography>
                    </td>
                    <td className="border-b border-blue-gray-50 px-4 py-3">
                      <Typography variant="small" className="font-normal">{plan}</Typography>
                    </td>
                    <td className="border-b border-blue-gray-50 px-4 py-3">
                      <Typography variant="small" className="font-normal">${price}</Typography>
                    </td>
                    <td className="border-b border-blue-gray-50 px-4 py-3">
                      <Typography variant="small" className="font-normal">{start}</Typography>
                    </td>
                    <td className="border-b border-blue-gray-50 px-4 py-3">
                      <Chip
                        size="sm"
                        variant="ghost"
                        color={status === "Active" ? "green" : "amber"}
                        value={status}
                        className="w-fit"
                      />
                    </td>
                  </tr>
                ))}
                {recentSubscriptions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center">
                      <Typography variant="small" className="text-blue-gray-600">No subscriptions to display.</Typography>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>

      {/* Row 3: OPEN cards */}
      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3 items-stretch">
        {[
          {
            title: "Subscription creation/editing",
            desc: "Create, edit or assign subscription types to clients.",
            to: "/dashboard/subscriptions",
            icon: RectangleStackIcon,
          },
          {
            title: "Client management",
            desc: "Manage client profiles (name, email, phone) and view their activity.",
            to: "/dashboard/clients",
            icon: UserGroupIcon,
          },
          {
            title: "Email logs",
            desc: "See invoices, reminders, and weekly updates that were sent.",
            to: "/dashboard/email-logs",
            icon: EnvelopeIcon,
          },
        ].map(({ title, desc, to, icon: Icon }) => (
          <Card key={title} className="border border-blue-gray-100 shadow-sm h-full">
            <CardHeader floated={false} shadow={false} color="transparent" className="m-0 p-6 pb-0">
              <div className="flex items-center gap-3">
                <Icon className="h-6 w-6 text-blue-gray-700" />
                <Typography variant="h6" color="blue-gray" className="leading-tight">
                  {title}
                </Typography>
              </div>
            </CardHeader>
            <CardBody className="pt-2 flex h-full flex-col">
              <Typography className="mb-4 flex-1 leading-relaxed text-blue-gray-600">
                {desc}
              </Typography>
              <div className="mt-auto flex justify-end">
                <Link to={to} className="inline-flex items-center">
                  <Button color="blue" variant="outlined" size="sm" className="flex items-center gap-2">
                    OPEN <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Row 4: Recent Invoices */}
      <Card className="border border-blue-gray-100 shadow-sm">
        <CardHeader floated={false} shadow={false} color="transparent" className="m-0 p-6">
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-2">
                Recent Invoices
              </Typography>
              <Typography variant="small" className="text-blue-gray-600">
                Manage the last 5 invoices (you can mark as paid)
              </Typography>
            </div>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {["Invoice #", "Client", "Amount", "Due", "Status", ""].map((h, i) => (
                  <th key={`${h}-${i}`} className="border-b border-blue-gray-50 py-3 px-6 text-left">
                    <Typography
                      variant="small"
                      className="text-[11px] font-medium uppercase text-blue-gray-400"
                    >
                      {h}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map(({ no, client, amount, due, status }, key) => (
                <tr key={no}>
                  <td className={`py-3 px-5 ${key === recentInvoices.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                    <Typography variant="small" color="blue-gray" className="font-normal">{no}</Typography>
                  </td>
                  <td className={`py-3 px-5 ${key === recentInvoices.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                    <Typography variant="small" color="blue-gray" className="font-normal">{client}</Typography>
                  </td>
                  <td className={`py-3 px-5 ${key === recentInvoices.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                    <Typography variant="small" color="blue-gray" className="font-normal">${amount.toFixed(2)}</Typography>
                  </td>
                  <td className={`py-3 px-5 ${key === recentInvoices.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                    <Typography variant="small" color="blue-gray" className="font-normal">{due}</Typography>
                  </td>
                  <td className={`py-3 px-5 ${key === recentInvoices.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                    <Chip
                      size="sm"
                      variant="ghost"
                      color={
                        status === "Paid" ? "green" :
                        status === "Overdue" ? "red" : "amber"
                      }
                      value={status}
                      className="w-fit"
                    />
                  </td>
                  <td className={`py-3 px-5 text-right ${key === recentInvoices.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                    <IconButton variant="text" color="blue-gray" onClick={() => removeInvoice(no)}>
                      <XMarkIcon className="h-5 w-5" />
                    </IconButton>
                  </td>
                </tr>
              ))}
              {recentInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center">
                    <Typography variant="small" className="text-blue-gray-600">No invoices to display.</Typography>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
          </>
            )}
    
    </div>
  );
}

export default Home;