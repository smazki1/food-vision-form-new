
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Upload, Users, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const IndexPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ברוכים הבאים ל-Food Vision AI
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            פלטפורמה מתקדמת לעיבוד תמונות מזון באמצעות בינה מלאכותית
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2 text-blue-600" />
                העלאת תמונות
              </CardTitle>
              <CardDescription>
                העלו תמונות מזון לעיבוד מקצועי
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/public-upload">
                <Button className="w-full">
                  התחל עכשיו
                  <ArrowRight className="h-4 w-4 mr-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-600" />
                התחברות לקוחות
              </CardTitle>
              <CardDescription>
                כניסה לאזור הלקוחות
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/customer-login">
                <Button variant="outline" className="w-full">
                  התחבר
                  <ArrowRight className="h-4 w-4 mr-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                ניהול מערכת
              </CardTitle>
              <CardDescription>
                כניסה לאזור הניהול
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin-login">
                <Button variant="secondary" className="w-full">
                  כניסה לניהול
                  <ArrowRight className="h-4 w-4 mr-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-gray-500">
            © 2025 Food Vision AI. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
