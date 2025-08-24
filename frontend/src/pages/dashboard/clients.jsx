import React, { useState, useEffect } from "react";
import {
  Typography,
  Card,
  CardBody,
  IconButton,
  Button,
  Input,
  Textarea,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Tooltip,
  Chip,
} from "@material-tailwind/react";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { API } from "@/configs/base-url";  

const CLIENTS_API = `${API}/clients`;

export function Clients() {
  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    company: "",
    notes: "",
    tags: "",
    image: null,
  });
  const [preview, setPreview] = useState("");

  // Load clients from backend
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await axios.get(CLIENTS_API);
      console.log("Fetched clients:", res.data);
      setClients(res.data);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  const handleOpen = () => {
    setPreview("");
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      company: "",
      notes: "",
      tags: "",
      image: null,
    });
    setEditId(null);
    setOpen(!open);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setFormData((prev) => ({ ...prev, image: file }));
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone || !formData.email) return;

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("phone", formData.phone);
      data.append("email", formData.email);
      data.append("address", formData.address);
      data.append("company", formData.company);
      data.append("notes", formData.notes);
      data.append("tags", formData.tags);
      if (formData.image) data.append("image", formData.image);

      if (editId) {
        await axios.put(`${CLIENTS_API}/${editId}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post(CLIENTS_API, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      fetchClients();
      handleOpen();
    } catch (err) {
      console.error("Error saving client:", err);
    }
  };

  const handleEdit = (client) => {
    setFormData({
      name: client.name,
      phone: client.phone,
      email: client.email,
      address: client.address,
      company: client.company,
      notes: client.notes,
      tags: client.tags?.join(", ") || "",
      image: null, // fresh image sirf tab upload hogi jab user nayi select kare
    });
    setPreview(client.image ? `${API}/${client.image}` : "");
    setEditId(client._id);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${CLIENTS_API}/${id}`);
      fetchClients();
    } catch (err) {
      console.error("Error deleting client:", err);
    }
  };

  return (
    <div className="mt-12 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Typography variant="h4" color="blue-gray" className="font-bold">
          Client Management
        </Typography>
        <Button
          color="blue"
          className="flex items-center gap-2"
          onClick={handleOpen}
        >
          <PlusIcon className="h-5 w-5" /> Add Client
        </Button>
      </div>

      {/* Client Cards */}
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {clients.map((client) => (
          <Card
            key={client._id}
            className="rounded-xl overflow-hidden shadow-lg transform hover:scale-[1.02] transition-all duration-300"
          >
            {/* Gradient Header */}
            <div className="relative h-28 bg-gradient-to-r from-blue-gray-800 via-blue-gray-900 to-black">
              <div className="absolute left-1/2 -bottom-12 transform -translate-x-1/2">
                <img
                  src={
                    client.image
                      ? `${API}${client.image}`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          client.name
                        )}&background=random`
                  }
                  alt={client.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                />
              </div>
            </div>

            <CardBody className="mt-14 text-center px-6 pb-6">
              <Typography variant="h6" className="font-bold text-gray-800">
                {client.name}
              </Typography>
              <Typography variant="small" color="gray" className="mb-3">
                {client.company || "—"}
              </Typography>

              <div className="text-left space-y-1 text-sm text-gray-700">
                <p>📧 {client.email}</p>
                <p>📞 {client.phone}</p>
                {client.address && <p>📍 {client.address}</p>}
              </div>

              {client.notes && (
                <Typography
                  variant="small"
                  color="gray"
                  className="italic mt-3 block"
                >
                  {client.notes}
                </Typography>
              )}

              {client.tags && client.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center mt-3">
                  {client.tags.map((tag, i) => (
                    <Chip
                      key={i}
                      size="sm"
                      variant="filled"
                      color="blue"
                      value={tag}
                      className="capitalize"
                    />
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-6 justify-center">
                <Tooltip content="Edit">
                  <IconButton
                    variant="outlined"
                    color="blue"
                    onClick={() => handleEdit(client)}
                  >
                    <PencilIcon className="h-5 w-5" />
                  </IconButton>
                </Tooltip>
                <Tooltip content="Delete">
                  <IconButton
                    variant="outlined"
                    color="red"
                    onClick={() => handleDelete(client._id)}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </IconButton>
                </Tooltip>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Add/Edit Client Dialog */}
      <Dialog open={open} handler={handleOpen} size="lg" className="bg-white">
        <DialogHeader>
          {editId ? "Edit Client" : "Add Client"}
        </DialogHeader>
        <DialogBody divider className="max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} />
            <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
            <Input label="Email Address" name="email" value={formData.email} onChange={handleChange} />
            <Input label="Company" name="company" value={formData.company} onChange={handleChange} />
            <Input label="Address" name="address" value={formData.address} onChange={handleChange} />
            <Input label="Tags (comma separated)" name="tags" value={formData.tags} onChange={handleChange} />
            <div className="md:col-span-2">
              <Textarea label="Notes" name="notes" value={formData.notes} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <Input type="file" label="Profile Picture" onChange={handleImageChange} />
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="mt-3 w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                />
              )}
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="text" color="red" onClick={handleOpen} className="mr-2">
            Cancel
          </Button>
          <Button color="green" onClick={handleSave}>
            {editId ? "Update" : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default Clients;
