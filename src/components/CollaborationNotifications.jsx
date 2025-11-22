import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { UserPlus, UserMinus, FilePlus, FileEdit, Trash2 } from 'lucide-react';

const CollaborationNotifications = () => {
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!socket) return;

    // User joined workspace
    const handleUserJoined = (data) => {
      const { userName } = data;
      toast.success(`${userName} joined the workspace`, {
        icon: <UserPlus size={16} />,
        duration: 3000,
      });
    };

    // User left workspace
    const handleUserLeft = (data) => {
      const { userName } = data;
      toast.info(`${userName} left the workspace`, {
        icon: <UserMinus size={16} />,
        duration: 3000,
      });
    };

    // Element created
    const handleElementCreated = (data) => {
      const { userName, element } = data;

      // Don't show notification for own actions
      if (data.userId === user?._id) return;

      const elementType = element.type === 'title' ? 'Title'
        : element.type === 'description' ? 'Description'
        : element.type === 'macro' ? 'Macro'
        : element.type === 'example' ? 'Example'
        : 'Element';

      toast(`${userName} created a ${elementType}`, {
        icon: <FilePlus size={16} className="text-green-600" />,
        duration: 3000,
      });
    };

    // Element updated
    const handleElementUpdated = (data) => {
      const { userName, element } = data;

      // Don't show notification for own actions
      if (data.userId === user?._id) return;

      const elementType = element.type === 'title' ? 'Title'
        : element.type === 'description' ? 'Description'
        : element.type === 'macro' ? 'Macro'
        : element.type === 'example' ? 'Example'
        : 'Element';

      toast(`${userName} updated a ${elementType}`, {
        icon: <FileEdit size={16} className="text-blue-600" />,
        duration: 2000,
      });
    };

    // Element deleted
    const handleElementDeleted = (data) => {
      const { userName } = data;

      // Don't show notification for own actions
      if (data.userId === user?._id) return;

      toast(`${userName} deleted an element`, {
        icon: <Trash2 size={16} className="text-red-600" />,
        duration: 3000,
      });
    };

    // Element editing started
    const handleEditingStarted = (data) => {
      const { userName, elementId } = data;

      // Don't show notification for own actions
      if (data.userId === user?._id) return;

      toast(`${userName} is editing`, {
        icon: <FileEdit size={16} className="text-amber-600" />,
        duration: 2000,
      });
    };

    // Register event listeners
    socket.on('workspace:user:joined', handleUserJoined);
    socket.on('workspace:user:left', handleUserLeft);
    socket.on('workspace:element:created:notify', handleElementCreated);
    socket.on('workspace:element:updated:notify', handleElementUpdated);
    socket.on('workspace:element:deleted:notify', handleElementDeleted);
    socket.on('workspace:element:editing:started', handleEditingStarted);

    // Cleanup
    return () => {
      socket.off('workspace:user:joined', handleUserJoined);
      socket.off('workspace:user:left', handleUserLeft);
      socket.off('workspace:element:created:notify', handleElementCreated);
      socket.off('workspace:element:updated:notify', handleElementUpdated);
      socket.off('workspace:element:deleted:notify', handleElementDeleted);
      socket.off('workspace:element:editing:started', handleEditingStarted);
    };
  }, [socket, user]);

  // This component doesn't render anything
  return null;
};

export default CollaborationNotifications;
