import React, { useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "@material-tailwind/react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  Option,
  Chip,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import axios from "axios";
import { API } from "@/configs/base-url"; // e.g., http://localhost:5000/api

const SUBSCRIPTIONS_API = `${API}/subscriptions`;
const CLIENTS_API = `${API}/clients`;

/* ----------------------------- Card (portrait) ----------------------------- */
// In Subscription.jsx
function PriceCard({ sub, featured, onEdit, onDelete }) {
  const durationLabel =
    sub.duration === 'weekly' ? 'Weekly' : sub.duration === 'yearly' ? 'Yearly' : 'Monthly';

  return (
    <div
      className={[
        'relative w-[85%] sm:w-[70%] md:w-[55%] lg:w-[420px] flex-shrink-0 transition-all duration-300',
        featured ? 'z-10 scale-[1.04]' : 'scale-100',
      ].join(' ')}
    >
      <Card
        className={[
          'h-full rounded-xl overflow-hidden',
          featured
            ? 'bg-blue-gray-800 text-white shadow-xl'
            : 'bg-white text-blue-gray-900 border border-blue-gray-100 shadow-sm',
        ].join(' ')}
      >
        <div className="absolute right-3 top-3 z-30 flex gap-2">
          <Button
            size="sm"
            variant="text"
            color={featured ? 'white' : 'blue'}
            onClick={onEdit}
            className="flex items-center gap-1"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="text"
            color="red"
            onClick={onDelete}
            className="flex items-center gap-1"
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </Button>
        </div>

        <CardBody className="px-7 py-8">
          <div className="mb-4">
            <Typography variant="h6" color={featured ? 'white' : 'blue-gray'}>
              {sub.name}
            </Typography>
            <div className="mt-2 flex items-baseline gap-2">
              <Typography
                variant="h2"
                className="font-extrabold leading-none"
                color={featured ? 'white' : 'blue-gray'}
              >
                ${sub.price}
              </Typography>
              <Typography variant="small" className={featured ? 'opacity-80' : 'text-blue-gray-600'}>
                /{durationLabel.toLowerCase()}
              </Typography>
            </div>
          </div>

          {sub.description ? (
            <Typography variant="small" className={featured ? 'mb-4 opacity-80' : 'mb-4 text-blue-gray-700'}>
              {sub.description}
            </Typography>
          ) : null}

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <Typography variant="small" className={featured ? 'opacity-80' : 'text-blue-gray-600'}>
                Start
              </Typography>
              <div className={featured ? 'text-white' : 'text-blue-gray-900'}>
                {new Date(sub.startDate).toLocaleDateString() || '—'}
              </div>
            </div>
            <div>
              <Typography variant="small" className={featured ? 'opacity-80' : 'text-blue-gray-600'}>
                End
              </Typography>
              <div className={featured ? 'text-white' : 'text-blue-gray-900'}>
                {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '—'}
              </div>
            </div>
          </div>

          <div>
            <Typography variant="small" className={featured ? 'mb-2 opacity-80' : 'mb-2 text-blue-gray-600'}>
              Assigned customers
            </Typography>
            {sub.clients?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {sub.clients.map((client) => (
                  <Chip
                    key={client._id}
                    size="sm"
                    variant="ghost"
                    color={featured ? 'white' : 'blue'}
                    value={client.name || client.email || client._id} // Display name or email
                    className="w-fit"
                  />
                ))}
              </div>
            ) : (
              <Typography variant="small" className={featured ? 'opacity-60' : 'text-blue-gray-500'}>
                None
              </Typography>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
 
/* ---------------------- Horizontal carousel  ---------------------- */
function PackagesCarousel({ items, onEdit, onDelete }) {
  const containerRef = useRef(null);
  const firstCardRef = useRef(null);
  const [active, setActive] = useState(0);
  const [cardW, setCardW] = useState(0);
  const GAP = 24;

  useEffect(() => {
    const measure = () => {
      if (firstCardRef.current) {
        // width includes computed CSS width; we keep it for layout decisions if needed
        setCardW(firstCardRef.current.getBoundingClientRect().width);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Utility: center the active card using scrollIntoView
  const scrollToIndex = (index) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const child = container.children[index];
    if (!child) return;
    // Use scrollIntoView with inline: 'center' for horizontal centering
    child.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  // navigate
  const prev = () => {
    setActive((i) => {
      const nextIndex = Math.max(0, i - 1);
      // scroll after state update (use microtask)
      setTimeout(() => scrollToIndex(nextIndex), 0);
      return nextIndex;
    });
  };
  const next = () => {
    setActive((i) => {
      const nextIndex = Math.min(items.length - 1, i + 1);
      setTimeout(() => scrollToIndex(nextIndex), 0);
      return nextIndex;
    });
  };

  // clicking a card makes it active and centers it
  const handleCardClick = (idx) => {
    setActive(idx);
    setTimeout(() => scrollToIndex(idx), 0);
  };

  // auto-center current active on mount / when items change
  useEffect(() => {
    if (items.length && containerRef.current) {
      // small delay to allow layout to settle
      setTimeout(() => scrollToIndex(active), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  if (!items.length) {
    return (
      <Card className="bg-white text-blue-gray-900 shadow-sm border border-blue-gray-100">
        <CardBody className="flex flex-col items-center justify-center py-16">
          <UserGroupIcon className="mb-3 h-10 w-10 text-blue-gray-400" />
          <Typography variant="h6" color="blue-gray" className="mb-1">
            No subscriptions
          </Typography>
          <Typography variant="small" className="font-normal text-blue-gray-600">
            Create a subscription to see packages here.
          </Typography>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-2">
          <IconButton variant="outlined" color="blue" onClick={prev} disabled={active === 0}>
            <ChevronLeftIcon className="h-5 w-5" />
          </IconButton>
          <IconButton color="blue" onClick={next} disabled={active === items.length - 1}>
            <ChevronRightIcon className="h-5 w-5" />
          </IconButton>
        </div>
      </div>

      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto"
        style={{
          WebkitOverflowScrolling: "touch",
          // hide native scrollbar visually if you want: uncomment later
          // scrollbarWidth: 'none'
        }}
      >
        <div
          className="flex items-stretch"
          style={{
            gap: `${GAP}px`,
            padding: "8px 4px",
            touchAction: "pan-y",
            // allow horizontal scrolling snap behavior to be nicer
            scrollSnapType: "x mandatory",
            alignItems: "stretch",
          }}
        >
          {items.map((s, i) => (
            <div
              key={s._id}
              ref={i === 0 ? firstCardRef : undefined}
              className="shrink-0"
              onClick={() => handleCardClick(i)}
              aria-current={active === i ? "true" : "false"}
              style={{
                scrollSnapAlign: "center",
                cursor: "pointer",
                // keep the same responsive widths you're using; ensures predictable card size
                width: i === 0 ? undefined : undefined,
                minWidth: "260px", // fallback so cards don't collapse on tiny screens
              }}
            >
              <PriceCard
                sub={s}
                featured={i === active}
                onEdit={() => onEdit(s._id)}
                onDelete={() => onDelete(s._id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


/* ----------------------- Client Select -------------------- */
function ClientSelect({ value, onChange, clients }) {
  return (
    <div>
      <Select
        label="Select Client"
        value={value[0] || ""} // Since we're changing from multiple to single selection
        onChange={(val) => onChange(val ? [val] : [])}
      >
        {clients?.map((client) => (
          <Option key={client._id} value={client._id}>
            {client.name || client.email}
          </Option>
        ))}
      </Select>
    </div>
  );
      
}

/* -------------------------------- Page ----------------------------------- */
export function Subscriptions() {
  const [rows, setRows] = useState([]);
  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
    const [loadingSubs, setLoadingSubs] = useState(true);    
  const [loadingClients, setLoadingClients] = useState(false);
  const [editingId, setEditingId] = useState(null);
const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: "",
    duration: "monthly",
    description: "",
    startDate: "",
    endDate: "",
    clients: [],
  });

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  // Fetch subscriptions on mount
  const fetchClients = async () => {
    try {
       setLoadingClients(true);
      const response = await axios.get(CLIENTS_API, {
        // headers: { Authorization: `Bearer ${token}` },
      });
      
      setClients(response.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      alert('Failed to fetch clients');
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchClients();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoadingSubs(true);
      const response = await axios.get(SUBSCRIPTIONS_API, {
        // headers: { Authorization: `Bearer ${token}` },
      });
      console.log(response.data)
      setRows(response.data);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      alert('Failed to fetch subscriptions');
    }finally {
      setLoadingSubs(false);
    }
  };

  const resetForm = () =>
    setForm({
      name: "",
      price: "",
      duration: "monthly",
      description: "",
      startDate: "",
      endDate: "",
      clients: [],
    });

  const handleOpen = () => setOpen((v) => !v);

  const onNew = () => {
    setEditingId(null);
    resetForm();
    setOpen(true);
  };

  const onEdit = async (id) => {
    try {
      // const token = localStorage.getItem('token');
      const response = await axios.get(`${SUBSCRIPTIONS_API}/${id}`, {
        // headers: { Authorization: `Bearer ${token}` },
      });
      const r = response.data;
      setEditingId(id);
      setForm({
        name: r.name,
        price: String(r.price),
        duration: r.duration,
        description: r.description || "",
        startDate: r.startDate ? r.startDate.split('T')[0] : "",
        endDate: r.endDate ? r.endDate.split('T')[0] : "",
        clients: [...(r.clients || [])],
      });
      setOpen(true);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      alert('Failed to fetch subscription');
    }
  };

  const onDelete = async (id) => {
    try {
      // const token = localStorage.getItem('token');
      await axios.delete(`${SUBSCRIPTIONS_API}/${id}`, {
        // headers: { Authorization: `Bearer ${token}` },
      });
      fetchSubscriptions();
    } catch (err) {
      console.error('Error deleting subscription:', err);
      alert('Failed to delete subscription');
    }
  };

  const saveForm = async (e) => {
    if (!form.name || !form.price || !form.duration || !form.startDate) {
      alert("Please fill required fields: Name, Price, Duration, Start Date.");
      return;
    }
    e.preventDefault();
        if (isSubmitting) return; // Prevent multiple submissions
        setIsSubmitting(true);

    try {
      // const token = localStorage.getItem('token');
      const data = {
        name: form.name,
        price: Number(form.price),
        duration: form.duration,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        clients: form.clients,
      };
console.log(data)
      if (isEditing) {
        await axios.put(`${SUBSCRIPTIONS_API}/${editingId}`, data, {
          // headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${SUBSCRIPTIONS_API}/`, data, {
          // headers: { Authorization: `Bearer ${token}` },
        });
      }

      fetchSubscriptions();
      setOpen(false);
      setEditingId(null);
      resetForm();
    } catch (err) {
      console.error('Error saving subscription:', err);
      alert('Failed to save subscription');
    } finally {
            setIsSubmitting(false);
        }
  };

  return (
    <div className="mt-8">
      <div className="mb-6 flex items-center justify-between">
        <Typography variant="h4" color="blue-gray" className="tracking-tight">
          Subscriptions
        </Typography>
        <Button color="blue" className="flex items-center gap-2" onClick={onNew}>
          <PlusIcon className="h-5 w-5" />
          Add Subscription
        </Button>
      </div>
 {loadingSubs ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-10 w-10 text-blue-600" />
        </div>
      ) : (
        <div className="mb-10">
          <PackagesCarousel items={rows} onEdit={onEdit} onDelete={onDelete} />
        </div>
      )}
       

      <Dialog open={open} handler={handleOpen} size="lg">
        <DialogHeader className="flex w-full items-center justify-between">
          <Typography variant="h5" color="blue-gray" className="tracking-tight">
            {isEditing ? "Edit Subscription" : "Add Subscription"}
          </Typography>
        </DialogHeader>

        <DialogBody
          divider
          className="grid gap-4 md:grid-cols-2 max-h-[70vh] overflow-y-auto pr-2"
        >
          <Input
            label="Name *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />

          <Input
            type="number"
            label="Price (USD) *"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          />

          <Select
            label="Duration *"
            value={form.duration}
            onChange={(val) => setForm((f) => ({ ...f, duration: val || "monthly" }))}
          >
            <Option value="weekly">Weekly</Option>
            <Option value="monthly">Monthly</Option>
            <Option value="yearly">Yearly</Option>
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Start Date *"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
            <Input
              type="date"
              label="End Date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>

           <div className="md:col-span-2">
            {loadingClients ? (
              <div className="flex items-center justify-center py-6">
                <Spinner className="h-6 w-6 text-blue-600" />
              </div>
            ) : (
              <ClientSelect
                value={form.clients}
                onChange={(arr) => setForm((f) => ({ ...f, clients: arr }))}
                clients={clients}
              />
            )}
          </div>

          <div className="md:col-span-2">
            <Textarea
              rows={3}
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
        </DialogBody>

        <DialogFooter className="flex items-center justify-between gap-2">
          <Typography variant="small" color="blue-gray">
            Fields marked with * are required.
          </Typography>
          <div className="flex items-center gap-2">
            <Button variant="text" color="blue-gray" onClick={handleOpen}>
              Cancel
            </Button>
            <Button
              color="blue"
              onClick={saveForm}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
             {isSubmitting && <Spinner className="h-4 w-4" />}
              {isSubmitting
                ? "Submitting..."
                : isEditing
                ? "Save Changes"
                : "Save Subscription"}
            </Button>
          </div>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default Subscriptions;