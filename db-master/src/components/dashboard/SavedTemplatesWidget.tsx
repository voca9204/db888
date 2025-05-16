import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui';
import { BookmarkIcon, ChevronRight } from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useFirebase } from '../../context/FirebaseContext';

interface TemplateItem {
  id: string;
  name: string;
  description?: string;
  createdAt: any;
  updatedAt: any;
  tags: string[];
}

const SavedTemplatesWidget: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useFirebase();
  
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const q = query(
          collection(db, 'queryTemplates'),
          where('createdBy', '==', currentUser.uid),
          orderBy('updatedAt', 'desc'),
          limit(5)
        );
        
        const querySnapshot = await getDocs(q);
        const templatesList: TemplateItem[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          templatesList.push({
            id: doc.id,
            name: data.name,
            description: data.description,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            tags: data.tags || [],
          });
        });
        
        setTemplates(templatesList);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, [user]);
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (error) {
      return '';
    }
  };
  
  return (
    <Card title="Saved Templates" className="h-full">
      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-t-blue-600 border-blue-300 rounded-full animate-spin"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="py-4 text-center text-gray-500 dark:text-gray-400">
          <BookmarkIcon className="mx-auto h-12 w-12 mb-2 text-gray-400 dark:text-gray-500" />
          <p>No saved templates yet.</p>
          <Link 
            to="/query-templates" 
            className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
          >
            Create a template
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {templates.map((template) => (
            <li key={template.id} className="py-3">
              <Link 
                to={`/query-templates/${template.id}`} 
                className="flex items-start hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-md"
              >
                <div className="flex-shrink-0 pt-1">
                  <BookmarkIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {template.name}
                  </p>
                  {template.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.tags.slice(0, 3).map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 px-1">
                          +{template.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2 mt-1">
                  {formatDate(template.updatedAt)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-2">
        <Link
          to="/query-templates"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
        >
          View all templates <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
    </Card>
  );
};

export default SavedTemplatesWidget;
