import React, { useEffect, useState } from "react";
import {
  Typography,
  Card,
  CardHeader,
  CardBody,
  Input,
  Textarea,
  Button,
  Chip,
  Select,
  Option,
} from "@material-tailwind/react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import axios from 'axios';
import { API } from '@/configs/base-url';

const EMAIL_API = `http://93.127.216.35:5000/email`;

export function Email() {
  const [reminderTemplates, setReminderTemplates] = useState({
    day3: '',
    day7: '',
    day14: '',
  });
  const [weeklyEmail, setWeeklyEmail] = useState({
    subject: '',
    content: '',
    attachment: null,
    recipients: 'all',
    scheduleDay: 'Monday',
    scheduleTime: '09:00',
    selectedClients: [],
  });
  const [clients, setClients] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);

  // Fetch data on mount
  useEffect(() => {
    const fetchReminderTemplates = async () => {
      try {
        const response = await axios.get(`${EMAIL_API}/reminder-templates`);
        const templates = response.data.reduce((acc, t) => ({ ...acc, [t.type]: t.content }), {});
        setReminderTemplates(templates);
      } catch (err) {
        console.error('Error fetching reminder templates:', err);
      }
    };

    const fetchClients = async () => {
      try {
        const response = await axios.get(`http://93.127.216.35:5000/clients`);
        setClients(response.data);
      } catch (err) {
        console.error('Error fetching clients:', err);
      }
    };

    const fetchEmailLogs = async () => {
      try {
        const response = await axios.get(`${EMAIL_API}/email-logs`);
        setEmailLogs(response.data);
      } catch (err) {
        console.error('Error fetching email logs:', err);
      }
    };

    fetchReminderTemplates();
    fetchClients();
    fetchEmailLogs();
  }, []);

  const handleAttachment = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setWeeklyEmail({
          ...weeklyEmail,
          attachment: { name: file.name, content: reader.result.split(',')[1], type: file.type },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTemplates = async () => {
    try {
      await axios.put(`${EMAIL_API}/reminder-templates`, reminderTemplates);
      alert('Templates saved successfully');
    } catch (err) {
      console.error('Error saving templates:', err);
      alert('Failed to save templates');
    }
  };

  const handleScheduleEmail = async () => {
    try {
      const payload = {
        ...weeklyEmail,
        selectedClients: weeklyEmail.recipients === 'selected' ? weeklyEmail.selectedClients : [],
      };
      await axios.post(`${EMAIL_API}/weekly-email`, payload);
      alert('Weekly email scheduled successfully');
    } catch (err) {
      console.error('Error scheduling email:', err);
      alert('Failed to schedule email');
    }
  };

  const handleClientSelection = (clientId) => {
    setWeeklyEmail((prev) => {
      const selectedClients = prev.selectedClients.includes(clientId)
        ? prev.selectedClients.filter((id) => id !== clientId)
        : [...prev.selectedClients, clientId];
      return { ...prev, selectedClients };
    });
  };

  return (
    <div className="mx-auto my-20 flex max-w-screen-lg flex-col gap-12">
      {/* Automated Email Reminders */}
      <Card className="shadow-lg hover:shadow-xl transition-all border border-blue-gray-100">
        <CardHeader color="transparent" floated={false} shadow={false} className="m-0 p-4">
          <Typography variant="h5" color="blue-gray">
            Automated Email Reminders
          </Typography>
          <Typography variant="small" color="blue-gray" className="mt-1">
            Emails will be sent automatically to clients if payment is not received.
          </Typography>
        </CardHeader>
        <CardBody className="flex flex-col gap-6 p-6 max-h-[600px] overflow-y-auto">
          {["3-Day Reminder", "7-Day Reminder", "14-Day Final Reminder"].map((label, index) => {
            const key = index === 0 ? "day3" : index === 1 ? "day7" : "day14";
            return (
              <div
                key={index}
                className="flex flex-col gap-2 p-4 rounded-lg shadow-sm hover:shadow-md transition bg-white border border-blue-gray-100"
              >
                <Typography className="font-semibold text-indigo-700">{label}</Typography>
                <Textarea
                  placeholder={`Enter email template for ${label.toLowerCase()}...`}
                  rows={4}
                  value={reminderTemplates[key]}
                  onChange={(e) =>
                    setReminderTemplates({ ...reminderTemplates, [key]: e.target.value })
                  }
                  className="bg-gray-100 border-gray-300 focus:border-indigo-400"
                />
                <Typography variant="small" color="blue-gray" className="mt-1">
                  This email will only be sent if payment has not been received.
                </Typography>
              </div>
            );
          })}
          <Button color="blue" className="self-end mt-2" onClick={handleSaveTemplates}>
            Save Templates
          </Button>
        </CardBody>
      </Card>

      {/* Weekly Email Update System */}
      <Card className="shadow-lg hover:shadow-xl transition-all border border-blue-gray-100">
        <CardHeader color="transparent" floated={false} shadow={false} className="m-0 p-4">
          <Typography variant="h5" color="blue-gray">
            Weekly Email Update System
          </Typography>
          <Typography variant="small" color="blue-gray" className="mt-1">
            Compose, schedule, and send weekly updates to clients.
          </Typography>
        </CardHeader>
        <CardBody className="flex flex-col gap-4 p-6">
          <Input
            label="Email Subject"
            value={weeklyEmail.subject}
            onChange={(e) => setWeeklyEmail({ ...weeklyEmail, subject: e.target.value })}
          />
          <Textarea
            label="Email Content (Rich text supported)"
            value={weeklyEmail.content}
            onChange={(e) => setWeeklyEmail({ ...weeklyEmail, content: e.target.value })}
            rows={6}
            className="bg-gray-100 border-gray-300 focus:border-pink-400"
          />
          <div>
            <Typography className="font-semibold mb-2">Attach File (PDF / Image)</Typography>
            <Input type="file" accept=".pdf,image/*" onChange={handleAttachment} />
            {weeklyEmail.attachment && (
              <Chip value={weeklyEmail.attachment.name} color="blue" className="mt-2" />
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Recipients"
              value={weeklyEmail.recipients}
              onChange={(value) => setWeeklyEmail({ ...weeklyEmail, recipients: value, selectedClients: [] })}
            >
              <Option value="all">All Active Clients</Option>
              <Option value="selected">Selected Clients</Option>
            </Select>
            <div className="flex gap-2">
              <Select
                label="Schedule Day"
                value={weeklyEmail.scheduleDay}
                onChange={(value) => setWeeklyEmail({ ...weeklyEmail, scheduleDay: value })}
              >
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                  (d) => (
                    <Option key={d} value={d}>
                      {d}
                    </Option>
                  )
                )}
              </Select>
              <Input
                type="time"
                value={weeklyEmail.scheduleTime}
                onChange={(e) => setWeeklyEmail({ ...weeklyEmail, scheduleTime: e.target.value })}
              />
            </div>
          </div>
          {weeklyEmail.recipients === 'selected' && (
            <div>
              <Typography className="font-semibold mb-2">Select Clients</Typography>
              <div className="flex flex-wrap gap-2">
                {clients.map((client) => (
                  <Chip
                    key={client._id}
                    value={client.name}
                    color={weeklyEmail.selectedClients.includes(client._id) ? 'blue' : 'gray'}
                    onClick={() => handleClientSelection(client._id)}
                    className="cursor-pointer"
                  />
                ))}
              </div>
            </div>
          )}
          <Button color="blue" className="self-end mt-4" onClick={handleScheduleEmail}>
            Schedule Email
          </Button>
        </CardBody>
      </Card>

      {/* Email Logs */}
      <Card className="shadow-lg hover:shadow-xl transition-all border border-blue-gray-100">
        <CardHeader color="transparent" floated={false} shadow={false} className="m-0 p-4">
          <Typography variant="h5" color="blue-gray">
            Email Logs
          </Typography>
          <Typography variant="small" color="blue-gray" className="mt-1">
            View history of sent emails.
          </Typography>
        </CardHeader>
        <CardBody className="p-6">
          <Table className="w-full min-w-max table-auto text-left">
            <TableHead>
              <TableRow>
                <TableCell>Recipient</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Invoice ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Sent At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {emailLogs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell>{log.recipient}</TableCell>
                  <TableCell className="max-w-[200px] truncate overflow-hidden whitespace-nowrap">{log.subject}</TableCell>
                  <TableCell>{log.type.charAt(0).toUpperCase() + log.type.slice(1)}</TableCell>
                  <TableCell>{log.invoiceId?.invoiceId || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      value={log.status}
                      color={log.status === 'sent' ? 'green' : 'red'}
                      variant="ghost"
                    />
                  </TableCell>
                  <TableCell>{new Date(log.sentAt).toLocaleString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
})
}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}

export default Email;