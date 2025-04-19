import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import RegisterPage from "../pages/RegisterPage";
import CheckEmailPage from "../pages/CheckEmailPage";
import CheckPasswordPage from "../pages/CheckPasswordPage";
import Home from "../pages/Home";
import MessagePage from "../components/MessagePage";
import AuthLayouts from "../layout";
import Forgotpassword from "../pages/Forgotpassword";
import ResetPassword from "../pages/ResetPassword";
import AdminRoute from "../components/AdminRoute";
import AdminDashboard from "../pages/AdminDashboard";
import BroadcastPage from "../pages/BroadcastPage";
import LoginPage from "../pages/LoginPage";
import PrivateRoute from "../components/PrivateRoute";
import GroupChatPage from "../pages/GroupChatPage";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App/>,
        children: [
            {
                path: "register",
                element: <AuthLayouts><RegisterPage/></AuthLayouts>
            },
            {
                path: "login",
                element: <AuthLayouts><LoginPage/></AuthLayouts>
            },
            {
                path: "email",
                element: <AuthLayouts><LoginPage/></AuthLayouts>
            },
            {
                path: "password",
                element: <AuthLayouts><LoginPage/></AuthLayouts>
            },
            {
                path: "forgot-password",
                element: <AuthLayouts><Forgotpassword/></AuthLayouts>
            },
            {
                path: "reset-password/:token",
                element: <AuthLayouts><ResetPassword/></AuthLayouts>
            },
            {
                element: <PrivateRoute/>,
                children: [
                    {
                        path: "",
                        element: <Home/>,
                        children: [
                            {
                                path: ":userId",
                                element: <MessagePage/>
                            },
                            {
                                path: "broadcast",
                                element: <BroadcastPage/>
                            },
                            {
                                path: "group/:groupId",
                                element: <GroupChatPage />
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        path: '/admin',
        element: <AdminRoute><AdminDashboard/></AdminRoute>
    }
]);

export default router;