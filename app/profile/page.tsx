"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Edit3, MapPin, Globe, Calendar, Save, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [user, setUser] = useState({
    id: "",
    name: "",
    email: "",
    image: "",
    bio: "",
    location: "",
    website: "",
    emailVerified: null,
    createdAt: ""
  });

  const [editForm, setEditForm] = useState(user);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch user profile data from API
  useEffect(() => {
    if (session?.user?.email) {
      fetchUserProfile();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch('/api/user/profile');
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      if (data.success) {
        const userData = {
          id: data.data.user.id,
          name: data.data.user.name || "",
          email: data.data.user.email || "",
          image: data.data.user.image || "",
          bio: data.data.user.bio || "",
          location: data.data.user.location || "",
          website: data.data.user.website || "",
          emailVerified: data.data.user.emailVerified,
          createdAt: data.data.user.createdAt || new Date().toISOString()
        };
        setUser(userData);
        setEditForm(userData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          bio: editForm.bio.trim(),
          location: editForm.location.trim(),
          website: editForm.website.trim(),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      if (data.success) {
        const updatedUserData = {
          ...user,
          name: data.data.user.name,
          bio: data.data.user.bio || "",
          location: data.data.user.location || "",
          website: data.data.user.website || "",
        };
        
        setUser(updatedUserData);
        setIsEditing(false);
        
        // Update session with new data
        await update({
          ...session,
          user: {
            ...session?.user,
            name: data.data.user.name,
            bio: data.data.user.bio,
            location: data.data.user.location,
            website: data.data.user.website,
          }
        });
        
        // Show success message
        alert('Profile updated successfully!');
      }
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditForm(user);
    setIsEditing(false);
    setError("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (status === "loading" || fetchLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          {!isEditing && (
            <Button 
              onClick={() => setIsEditing(true)}
              className="bg-white text-black hover:bg-gray-200"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-zinc-900/40 border-zinc-800/50">
              <CardContent className="p-6 text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src={user.image} />
                  <AvatarFallback className="bg-zinc-700 text-white text-2xl">
                    {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <h2 className="text-xl font-semibold text-white mb-1">{user.name || 'No name set'}</h2>
                <p className="text-gray-400 mb-3">{user.email}</p>
                
                {user.emailVerified && (
                  <Badge className="bg-blue-600 text-white mb-4">
                    Verified User
                  </Badge>
                )}

                <div className="space-y-2 text-sm text-gray-400">
                  {user.location && (
                    <div className="flex items-center justify-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  
                  {user.website && (
                    <div className="flex items-center justify-center gap-2">
                      <Globe className="w-4 h-4" />
                      <a 
                        href={user.website.startsWith('http') ? user.website : `https://${user.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Website
                      </a>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDate(user.createdAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card className="bg-zinc-900/40 border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  Profile Information
                  {isEditing && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-1" />
                        )}
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleCancel}
                        disabled={loading}
                        className="border-zinc-700 text-white hover:bg-zinc-800"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Full Name *</label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="bg-zinc-800/50 border-zinc-700 text-white"
                        disabled={loading}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Email</label>
                      <Input
                        value={editForm.email}
                        className="bg-zinc-800/50 border-zinc-700 text-white opacity-50"
                        disabled
                        title="Email cannot be changed"
                      />
                      <p className="text-xs text-gray-500">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Bio</label>
                      <Textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                        className="bg-zinc-800/50 border-zinc-700 text-white min-h-[100px]"
                        placeholder="Tell us about yourself..."
                        disabled={loading}
                        maxLength={500}
                      />
                      <p className="text-xs text-gray-500">{editForm.bio.length}/500 characters</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Location</label>
                      <Input
                        value={editForm.location}
                        onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                        className="bg-zinc-800/50 border-zinc-700 text-white"
                        placeholder="City, Country"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Website</label>
                      <Input
                        value={editForm.website}
                        onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                        className="bg-zinc-800/50 border-zinc-700 text-white"
                        placeholder="yourwebsite.com"
                        disabled={loading}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Full Name</label>
                      <p className="text-white mt-1">{user.name || 'No name set'}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400">Email</label>
                      <p className="text-white mt-1">{user.email}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400">Bio</label>
                      <p className="text-white mt-1 leading-relaxed">
                        {user.bio || 'No bio added yet.'}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400">Location</label>
                      <p className="text-white mt-1">{user.location || 'No location added'}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400">Website</label>
                      <p className="text-white mt-1">
                        {user.website ? (
                          <a 
                            href={user.website.startsWith('http') ? user.website : `https://${user.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                          >
                            {user.website}
                          </a>
                        ) : (
                          'No website added'
                        )}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400">Member Since</label>
                      <p className="text-white mt-1">{formatDate(user.createdAt)}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}