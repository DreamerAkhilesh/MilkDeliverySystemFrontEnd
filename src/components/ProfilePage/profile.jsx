import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";
import { Home, User2, LogOut, Package, ShoppingCart, CreditCard, Settings, HelpCircle, Wallet, Pause, X } from "lucide-react";

// Define backend URL
const BACKEND_URL = 'http://localhost:5000';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [showAddMoneyDialog, setShowAddMoneyDialog] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        window.location.href = '/user/login';
        return;
      }

      // Fetch user data
      const userResponse = await axios.get(`${BACKEND_URL}/api/v1/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch subscriptions
      const subsResponse = await axios.get(`${BACKEND_URL}/api/v1/subscriptions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch wallet data
      const walletResponse = await axios.get(`${BACKEND_URL}/api/v1/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setUser(userResponse.data.data.user);
      setSubscriptions(subsResponse.data.data.subscriptions);
      setWallet(walletResponse.data.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.post(
        `${BACKEND_URL}/api/v1/wallet/add-money`,
        { amount: parseFloat(amount) },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success("Money added to wallet successfully!");
        setWallet(response.data.data);
        setShowAddMoneyDialog(false);
        setAmount("");
      }
    } catch (error) {
      console.error("Error adding money:", error);
      toast.error(error.response?.data?.message || "Failed to add money");
    }
  };

  const handlePauseSubscription = async (subscriptionId) => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.put(
        `${BACKEND_URL}/api/v1/subscriptions/${subscriptionId}/pause`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success("Subscription paused successfully!");
        fetchUserData();
      }
    } catch (error) {
      console.error("Error pausing subscription:", error);
      toast.error(error.response?.data?.message || "Failed to pause subscription");
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.put(
        `${BACKEND_URL}/api/v1/subscriptions/${subscriptionId}/cancel`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success("Subscription cancelled successfully!");
        fetchUserData();
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error(error.response?.data?.message || "Failed to cancel subscription");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl relative">
      {/* 🏠 Back to Home Icon */}
      <Link to="/" className="absolute top-4 left-4 p-2 bg-gray-200 rounded-full shadow-md hover:bg-gray-300 transition">
        <Home size={20} className="text-gray-600 hover:text-[#00B86C]" />
      </Link>

      {/* 🌟 Top Heading */}
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">My Profile</h1>

      {/* 👤 Profile Section */}
      <div className="p-6 bg-gray-100 rounded-2xl shadow-md flex flex-col items-center space-y-4">
        <Avatar className="w-20 h-20">
          <AvatarImage src={user?.profile?.profilePhoto} alt="Profile" />
          <AvatarFallback><User2 size={40} /></AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h2 className="text-xl font-semibold">{user?.name}</h2>
          <p className="text-gray-600">{user?.email}</p>
          <p className="text-gray-600">{user?.phone}</p>
        </div>
        
        {/* Wallet Section */}
        <div className="w-full mt-4 p-4 bg-white rounded-lg shadow">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Wallet Balance</h3>
              <p className="text-2xl font-bold text-[#00B86C]">₹{wallet.balance}</p>
            </div>
            <Button 
              onClick={() => setShowAddMoneyDialog(true)}
              className="bg-[#00B86C] hover:bg-[#00B86C]/90"
            >
              Add Money
            </Button>
          </div>
        </div>
      </div>

      {/* Active Subscriptions */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Active Subscriptions</h2>
        <div className="space-y-4">
          {subscriptions.filter(sub => sub.status === 'active').map(subscription => (
            <div key={subscription._id} className="p-4 bg-white rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{subscription.product}</h3>
                  <p className="text-gray-600">₹{subscription.pricePerDay}/day</p>
                  <p className="text-sm text-gray-500">
                    Next delivery: {new Date(subscription.nextDeliveryDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePauseSubscription(subscription._id)}
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelSubscription(subscription._id)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Money Dialog */}
      <Dialog open={showAddMoneyDialog} onOpenChange={setShowAddMoneyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Money to Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#00B86C] focus:ring-[#00B86C]"
                placeholder="Enter amount"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddMoneyDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddMoney}
                className="bg-[#00B86C] hover:bg-[#00B86C]/90"
              >
                Add Money
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
