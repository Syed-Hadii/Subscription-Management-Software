import {
  HomeIcon,
  UserCircleIcon,
  TableCellsIcon,
  InformationCircleIcon,
  ServerStackIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/solid";
import { Home,  Invoices, Email, Subscriptions, Clients} from "@/pages/dashboard";
import { SignIn, SignUp } from "@/pages/auth";

const icon = {
  className: "w-5 h-5 text-inherit",
};

export const routes = [
  {
    layout: "auth",
    pages: [
      {
        name: "sign in",
        path: "/sign-in",
        element: <SignIn />,
      },
      // {
      //   name: "sign up",
      //   path: "/sign-up",
      //   element: <SignUp />,
      // },
    ],
  },
  {
    layout: "dashboard",
    pages: [
      {
        icon: <HomeIcon {...icon} />,
        name: "dashboard",
        path: "/home",
        element: <Home />,
      },
      {
  icon: <RectangleStackIcon {...icon} />,
  name: "Subscriptions",
  path: "/subscriptions",
  element: <Subscriptions />,
},
{
  icon: <UserCircleIcon {...icon} />,
  name: "Clients",
  path: "/clients",
  element: <Clients />,
},

      
     
      {
        icon: <TableCellsIcon {...icon} />,
        name: "Invoices",
        path: "/invoices",
        element: <Invoices />,
      },
      {
        icon: <InformationCircleIcon {...icon} />,
        name: "Email-logs",
        path: "/email",
        element: <Email />,
      },
    ],
  },

];

export default routes;
