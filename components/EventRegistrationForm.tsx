"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Clock,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Question {
  id: string;
  text: string;
  type: 'TEXT' | 'EMAIL' | 'PHONE' | 'TEXTAREA' | 'SELECT' | 'RADIO' | 'CHECKBOX';
  required: boolean;
  options?: string[];
  order: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  venue?: string;
  maxAttendees?: number;
  price: number;
  requireApproval: boolean;
  attendeeCount: number;
  questions?: Question[]; // Make questions optional
}

interface RegistrationFormProps {
  event: Event;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EventRegistrationForm({ event, onSuccess, onCancel }: RegistrationFormProps) {
  const { data: session } = useSession();
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    setError(""); // Clear error when user starts typing
  };

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    const currentAnswers = answers[questionId] ? JSON.parse(answers[questionId]) : [];
    let newAnswers;
    
    if (checked) {
      newAnswers = [...currentAnswers, option];
    } else {
      newAnswers = currentAnswers.filter((item: string) => item !== option);
    }
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: JSON.stringify(newAnswers)
    }));
    setError("");
  };

  const validateForm = () => {
    const errors = [];
    
    // Only validate if questions exist and is an array
    if (event.questions && Array.isArray(event.questions)) {
      for (const question of event.questions) {
        if (question.required) {
          const answer = answers[question.id];
          if (!answer || answer.trim() === '') {
            errors.push(`${question.text} is required`);
            continue;
          }
        }
        
        const answer = answers[question.id];
        if (answer && answer.trim() !== '') {
          switch (question.type) {
            case 'EMAIL':
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(answer)) {
                errors.push(`Please enter a valid email for: ${question.text}`);
              }
              break;
            case 'PHONE':
              const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
              if (!phoneRegex.test(answer.replace(/\s|-|\(|\)/g, ''))) {
                errors.push(`Please enter a valid phone number for: ${question.text}`);
              }
              break;
          }
        }
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }
    
    setShowConfirmDialog(true);
  };

  const confirmRegistration = async () => {
    setLoading(true);
    setError("");
    setShowConfirmDialog(false);
    
    try {
      // Only format answers if questions exist and is an array
      const formattedAnswers = (event.questions && Array.isArray(event.questions)) 
        ? event.questions.map(question => ({
            questionId: question.id,
            answer: answers[question.id] || ''
          })).filter(answer => answer.answer.trim() !== '')
        : [];

      console.log('Submitting registration with answers:', formattedAnswers);

      const response = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: formattedAnswers
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(data.message);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
      
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const renderQuestionInput = (question: Question) => {
    const value = answers[question.id] || '';
    
    switch (question.type) {
      case 'TEXT':
        return (
          <Input
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="bg-zinc-800/50 border-zinc-700 text-white"
            placeholder={`Enter ${question.text.toLowerCase()}`}
            required={question.required}
          />
        );
        
      case 'EMAIL':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="bg-zinc-800/50 border-zinc-700 text-white"
            placeholder="Enter email address"
            required={question.required}
          />
        );
        
      case 'PHONE':
        return (
          <Input
            type="tel"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="bg-zinc-800/50 border-zinc-700 text-white"
            placeholder="Enter phone number"
            required={question.required}
          />
        );
        
      case 'TEXTAREA':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="bg-zinc-800/50 border-zinc-700 text-white min-h-[100px]"
            placeholder={`Enter ${question.text.toLowerCase()}`}
            required={question.required}
          />
        );
        
      case 'SELECT':
        return (
          <Select value={value} onValueChange={(value) => handleAnswerChange(question.id, value)}>
            <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              {question.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      case 'RADIO':
        return (
          <RadioGroup value={value} onValueChange={(value) => handleAnswerChange(question.id, value)}>
            {question.options?.map(option => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                <Label htmlFor={`${question.id}-${option}`} className="text-white">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
        
      case 'CHECKBOX':
        const selectedOptions = value ? JSON.parse(value) : [];
        return (
          <div className="space-y-2">
            {question.options?.map(option => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${option}`}
                  checked={selectedOptions.includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange(question.id, option, checked)}
                />
                <Label htmlFor={`${question.id}-${option}`} className="text-white">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );
        
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (success) {
    return (
      <Card className="bg-zinc-900/40 border-zinc-800/50">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Registration Successful!</h3>
          <p className="text-gray-400 mb-6">{success}</p>
          <Button onClick={onSuccess} className="bg-white text-black hover:bg-gray-200">
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-zinc-900/40 border-zinc-800/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Register for Event
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Summary */}
          <div className="p-4 bg-zinc-800/30 rounded-lg">
            <h4 className="font-semibold text-white mb-3">{event.title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(event.startDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>
                  {event.attendeeCount} registered
                  {event.maxAttendees && ` • ${event.maxAttendees - event.attendeeCount} spots left`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>{event.price > 0 ? `$${event.price}` : 'Free'}</span>
              </div>
            </div>
            
            {event.requireApproval && (
              <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-800/50 rounded">
                <p className="text-yellow-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  This event requires organizer approval
                </p>
              </div>
            )}
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {event.questions && event.questions.length > 0 && (
              <div className="space-y-4">
                <h5 className="font-medium text-white">Additional Information</h5>
                {event.questions
                  .sort((a, b) => a.order - b.order)
                  .map((question) => (
                    <div key={question.id} className="space-y-2">
                      <Label className="text-gray-400">
                        {question.text}
                        {question.required && <span className="text-red-400 ml-1">*</span>}
                      </Label>
                      {renderQuestionInput(question)}
                    </div>
                  ))}
              </div>
            )}

            {/* If no questions, show a simple message */}
            {(!event.questions || event.questions.length === 0) && (
              <div className="p-4 bg-zinc-800/30 rounded-lg text-center">
                <p className="text-gray-400">No additional information required</p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || !session}
                className="bg-white text-black hover:bg-gray-200 flex-1"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Registering...' : 'Register for Event'}
              </Button>
              
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                  className="border-zinc-700 text-white hover:bg-zinc-800"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>

            {!session && (
              <p className="text-gray-400 text-sm text-center">
                Please sign in to register for this event
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Confirm Registration</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to register for this event?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-zinc-800/50 rounded-lg">
              <h4 className="font-semibold text-white mb-2">{event.title}</h4>
              <p className="text-gray-400 text-sm">{formatDate(event.startDate)}</p>
              <p className="text-gray-400 text-sm">{event.location}</p>
            </div>
            
            {event.requireApproval && (
              <p className="text-yellow-400 text-sm">
                Your registration will be pending until approved by the organizer.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="border-zinc-700 text-white hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRegistration}
              disabled={loading}
              className="bg-white text-black hover:bg-gray-200"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Confirm Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}