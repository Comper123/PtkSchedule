import { GroupData } from '@/types/parse';
import { Users, Calendar, BookOpen, MapPin, User, GraduationCap, Hash } from 'lucide-react';
import Modal from "@/components/ui/Modal";
import Loader from './ui/Loader';


interface DetailModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  grNumber?: number | null;
  onClose: () => void;
  groupDetail: GroupData | null;
}


export default function DetailModal({ isOpen, isLoading, grNumber, onClose, groupDetail }: DetailModalProps) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='xl' title={`Группа ${grNumber}`} className={`h-[80vh]`}>
    {isLoading ? (
        <div className='h-full flex items-center justify-center w-full -translate-y-10'>
            <Loader></Loader>
        </div>
    ) : (<div className="p-6 w-full bg-white rounded-lg grid grid-cols-2 gap-10">
        <div>
            {/* Основная информация о группе */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <InfoCard
                icon={<Users className="w-5 h-5 text-blue-500" />}
                label="Студентов"
                value={groupDetail?.countStudent || ''}
            />
            <InfoCard
                icon={<Calendar className="w-5 h-5 text-green-500" />}
                label="Год поступления"
                value={groupDetail?.yearReceipt || ''}
            />
            <InfoCard
                icon={<GraduationCap className="w-5 h-5 text-purple-500" />}
                label="Курс"
                value={groupDetail?.course || ''}
            />
            <InfoCard
                icon={<BookOpen className="w-5 h-5 text-orange-500" />}
                label="Форма обучения"
                value={groupDetail?.formTraining || ''}
            />
            </div>

            {/* Детальная информация */}
            <div className="space-y-5 mb-6 p-4 bg-gray-50 rounded-lg">
            <InfoRow icon={<Hash className="w-4 h-4 text-gray-500" />} label="Направление" value={groupDetail?.direction || ''} />
            <InfoRow icon={<User className="w-4 h-4 text-gray-500" />} label="Профиль" value={groupDetail?.profile || ''} />
            <InfoRow icon={<MapPin className="w-4 h-4 text-gray-500" />} label="Институт" value={groupDetail?.institution || ''} />
            </div>
        </div>
        

        {/* Список студентов */}
        <div className="">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Список студентов ({groupDetail?.students.length})
          </h3>
          
          {groupDetail && groupDetail.students.length > 0 ? (
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">№</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">ФИО</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Статус</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {groupDetail.students.map((student) => (
                    <tr key={student.personId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 text-sm text-gray-600">{student.number}</td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-4 py-2 text-sm">
                        <StatusBadge status={student.status} />
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{student.personId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              Нет данных о студентах
            </p>
          )}
        </div>
      </div>
    )}
    </Modal>
  );
}

// Вспомогательные компоненты
function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg flex flex-col relative pb-[40px]">
      <div className="flex items-center flex-col gap-2 mb-1">
        {icon} 
        <span className="text-xs text-gray-500 flex text-center">{label}</span>
      </div>
      <p className="bottom-2 left-[50%] translate-x-[-50%] absolute text-lg text-center font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 pt-1">{icon}</div>
      <div className="flex-1">
        <span className="text-sm text-gray-500">{label}:</span>
        <p className="text-sm font-medium text-gray-900">{value || 'Не указано'}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    switch (status.trim()) {
      case 'СТ':
        return 'bg-green-100 text-green-800';
      case 'Академ':
        return 'bg-yellow-100 text-yellow-800';
      case 'Отчислен':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {status}
    </span>
  );
}