"use client";

import { useState } from "react";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Edit3, 
  Save, 
  X,
  ChevronUp,
  ChevronDown,
  Type,
  Mail,
  Phone,
  AlignLeft,
  List,
  CircleDot,
  CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Question {
  id: string;
  text: string;
  type: 'TEXT' | 'EMAIL' | 'PHONE' | 'TEXTAREA' | 'SELECT' | 'RADIO' | 'CHECKBOX';
  required: boolean;
  options?: string[];
  order: number;
}

interface QuestionManagerProps {
  eventId: string;
  questions: Question[];
  onQuestionsUpdate: (questions: Question[]) => void;
}

const QUESTION_TYPES = [
  { value: 'TEXT', label: 'Short Text', icon: Type },
  { value: 'EMAIL', label: 'Email', icon: Mail },
  { value: 'PHONE', label: 'Phone', icon: Phone },
  { value: 'TEXTAREA', label: 'Long Text', icon: AlignLeft },
  { value: 'SELECT', label: 'Dropdown', icon: List },
  { value: 'RADIO', label: 'Multiple Choice', icon: CircleDot },
  { value: 'CHECKBOX', label: 'Checkboxes', icon: CheckSquare },
];

export default function QuestionManager({ eventId, questions = [], onQuestionsUpdate }: QuestionManagerProps) {
  const [localQuestions, setLocalQuestions] = useState<Question[]>(questions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    type: 'TEXT' as Question['type'],
    required: false,
    options: ['']
  });

  const generateId = () => `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleAddQuestion = () => {
    if (!newQuestion.text.trim()) return;

    const question: Question = {
      id: generateId(),
      text: newQuestion.text.trim(),
      type: newQuestion.type,
      required: newQuestion.required,
      options: ['SELECT', 'RADIO', 'CHECKBOX'].includes(newQuestion.type) 
        ? newQuestion.options.filter(opt => opt.trim()) 
        : undefined,
      order: localQuestions.length
    };

    const updatedQuestions = [...localQuestions, question];
    setLocalQuestions(updatedQuestions);
    
    // Reset form
    setNewQuestion({
      text: '',
      type: 'TEXT',
      required: false,
      options: ['']
    });
    setShowAddDialog(false);
  };

  const handleDeleteQuestion = (id: string) => {
    const updatedQuestions = localQuestions
      .filter(q => q.id !== id)
      .map((q, index) => ({ ...q, order: index }));
    setLocalQuestions(updatedQuestions);
  };

  const handleMoveQuestion = (id: string, direction: 'up' | 'down') => {
    const currentIndex = localQuestions.findIndex(q => q.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === localQuestions.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const updatedQuestions = [...localQuestions];
    [updatedQuestions[currentIndex], updatedQuestions[newIndex]] = 
    [updatedQuestions[newIndex], updatedQuestions[currentIndex]];

    // Update order values
    updatedQuestions.forEach((q, index) => {
      q.order = index;
    });

    setLocalQuestions(updatedQuestions);
  };

  const handleEditQuestion = (id: string, field: keyof Question, value: any) => {
    setLocalQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const handleSaveQuestions = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/events/${eventId}/questions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questions: localQuestions }),
      });

      if (!response.ok) {
        throw new Error('Failed to save questions');
      }

      const data = await response.json();
      onQuestionsUpdate(localQuestions);
      // TODO: Show success toast
    } catch (error) {
      console.error('Error saving questions:', error);
      // TODO: Show error toast
    } finally {
      setSaving(false);
    }
  };

  const handleAddOption = () => {
    setNewQuestion(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const handleRemoveOption = (index: number) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = QUESTION_TYPES.find(t => t.value === type);
    const Icon = typeConfig?.icon || Type;
    return <Icon className="w-4 h-4" />;
  };

  const needsOptions = ['SELECT', 'RADIO', 'CHECKBOX'].includes(newQuestion.type);

  return (
    <Card className="bg-zinc-900/40 border-zinc-800/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <List className="w-5 h-5" />
            Registration Questions
          </CardTitle>
          <div className="flex gap-2">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-white text-black hover:bg-gray-200">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Registration Question</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Create a custom question for event registration
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-400">Question Text</Label>
                    <Input
                      value={newQuestion.text}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, text: e.target.value }))}
                      placeholder="Enter your question..."
                      className="bg-zinc-800/50 border-zinc-700 text-white mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-400">Question Type</Label>
                    <Select 
                      value={newQuestion.type} 
                      onValueChange={(value: Question['type']) => 
                        setNewQuestion(prev => ({ ...prev, type: value, options: [''] }))
                      }
                    >
                      <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {QUESTION_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {needsOptions && (
                    <div>
                      <Label className="text-gray-400">Options</Label>
                      <div className="space-y-2 mt-1">
                        {newQuestion.options.map((option, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              placeholder={`Option ${index + 1}`}
                              className="bg-zinc-800/50 border-zinc-700 text-white"
                            />
                            {newQuestion.options.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => handleRemoveOption(index)}
                                className="border-zinc-700 text-red-400 hover:bg-red-900/20"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddOption}
                          className="border-zinc-700 text-white hover:bg-zinc-800"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="required"
                      checked={newQuestion.required}
                      onCheckedChange={(checked) => 
                        setNewQuestion(prev => ({ ...prev, required: !!checked }))
                      }
                    />
                    <Label htmlFor="required" className="text-white">
                      Required field
                    </Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    className="border-zinc-700 text-white hover:bg-zinc-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddQuestion}
                    disabled={!newQuestion.text.trim()}
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    Add Question
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {localQuestions.length > 0 && (
              <Button
                onClick={handleSaveQuestions}
                disabled={saving}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {localQuestions.length === 0 ? (
          <div className="text-center py-12">
            <List className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Questions Yet</h3>
            <p className="text-gray-400 mb-6">
              Add custom questions to gather additional information from registrants
            </p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-white text-black hover:bg-gray-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Question
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {localQuestions
              .sort((a, b) => a.order - b.order)
              .map((question, index) => (
                <div
                  key={question.id}
                  className="flex items-center gap-3 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50"
                >
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-500 hover:text-white"
                      onClick={() => handleMoveQuestion(question.id, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-500 hover:text-white"
                      onClick={() => handleMoveQuestion(question.id, 'down')}
                      disabled={index === localQuestions.length - 1}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(question.type)}
                      <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                        {QUESTION_TYPES.find(t => t.value === question.type)?.label}
                      </Badge>
                      {question.required && (
                        <Badge className="bg-red-600 text-white">Required</Badge>
                      )}
                    </div>
                    
                    {editingId === question.id ? (
                      <div className="space-y-2">
                        <Input
                          value={question.text}
                          onChange={(e) => handleEditQuestion(question.id, 'text', e.target.value)}
                          className="bg-zinc-800/50 border-zinc-700 text-white"
                        />
                        {question.options && (
                          <div className="space-y-1">
                            {question.options.map((option, optIndex) => (
                              <Input
                                key={optIndex}
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...question.options!];
                                  newOptions[optIndex] = e.target.value;
                                  handleEditQuestion(question.id, 'options', newOptions);
                                }}
                                className="bg-zinc-800/50 border-zinc-700 text-white text-sm"
                                placeholder={`Option ${optIndex + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-white font-medium">{question.text}</p>
                        {question.options && (
                          <div className="mt-1 text-sm text-gray-400">
                            Options: {question.options.join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {editingId === question.id ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingId(null)}
                        className="text-green-400 hover:bg-green-900/20"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingId(question.id)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}