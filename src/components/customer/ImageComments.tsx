import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Edit, Trash2, X } from 'lucide-react';
import { useImageComments, useAddImageComment, useUpdateImageComment, useDeleteImageComment } from '@/hooks/useImageComments';
import { ImageComment, ImageCommentType } from '@/types/submission';
import { formatDate } from '@/utils/formatDate';

interface ImageCommentsProps {
  submissionId: string;
  imageUrl: string;
  imageType: 'original' | 'processed';
  viewMode?: 'admin' | 'customer' | 'editor';
}

export const ImageComments: React.FC<ImageCommentsProps> = ({
  submissionId,
  imageUrl,
  imageType,
  viewMode = 'customer'
}) => {
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<ImageComment | null>(null);
  const [editText, setEditText] = useState('');

  const { data: comments = [], isLoading } = useImageComments(submissionId, imageUrl);
  const addCommentMutation = useAddImageComment();
  const updateCommentMutation = useUpdateImageComment();
  const deleteCommentMutation = useDeleteImageComment();

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await addCommentMutation.mutateAsync({
        submissionId,
        imageUrl,
        imageType,
        commentType: 'client_visible',
        commentText: newComment.trim(),
        visibility: 'client'
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleEditComment = async () => {
    if (!editingComment || !editText.trim()) return;

    try {
      await updateCommentMutation.mutateAsync({
        commentId: editingComment.comment_id,
        commentText: editText.trim()
      });
      setEditingComment(null);
      setEditText('');
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק הערה זו?')) {
      try {
        await deleteCommentMutation.mutateAsync(commentId);
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const startEditing = (comment: ImageComment) => {
    setEditingComment(comment);
    setEditText(comment.comment_text);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditText('');
  };

  const canEditComment = (comment: ImageComment) => {
    // Admin can edit all comments
    if (viewMode === 'admin') return true;
    
    // Users can edit their own comments
    // This would need to be implemented with proper user ID checking
    return false; // For now, only admin can edit
  };

  const canDeleteComment = (comment: ImageComment) => {
    // Admin can delete all comments
    if (viewMode === 'admin') return true;
    
    // Users can delete their own comments
    // This would need to be implemented with proper user ID checking
    return false; // For now, only admin can delete
  };

  const getCommentTypeLabel = (commentType: ImageCommentType) => {
    switch (commentType) {
      case 'admin_internal': return 'הערה פנימית';
      case 'client_visible': return 'הערה ללקוח';
      case 'editor_note': return 'הערה לעורך';
      default: return 'הערה';
    }
  };

  const getCommentTypeColor = (commentType: ImageCommentType) => {
    switch (commentType) {
      case 'admin_internal': return 'bg-red-100 text-red-800';
      case 'client_visible': return 'bg-green-100 text-green-800';
      case 'editor_note': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            הערות לתמונה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            טוען הערות...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          הערות לתמונה ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new comment */}
        <div className="space-y-3">
          <Textarea
            placeholder="כתוב הערה לתמונה זו..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-between items-center">
            <Badge variant="outline" className={getCommentTypeColor('client_visible')}>
              {getCommentTypeLabel('client_visible')}
            </Badge>
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || addCommentMutation.isPending}
              size="sm"
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              הוסף הערה
            </Button>
          </div>
        </div>

        {/* Comments list */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              אין הערות לתמונה זו עדיין
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.comment_id} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getCommentTypeColor(comment.comment_type)}>
                      {getCommentTypeLabel(comment.comment_type)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {canEditComment(comment) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(comment)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                    {canDeleteComment(comment) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.comment_id)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {editingComment?.comment_id === comment.comment_id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[60px] resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleEditComment}
                        disabled={updateCommentMutation.isPending}
                      >
                        שמור
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEditing}
                      >
                        ביטול
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-line">{comment.comment_text}</p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
