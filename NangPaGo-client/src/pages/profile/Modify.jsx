import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '../../api/axiosInstance.js';
import Header from '../../components/layout/header/Header';
import Footer from '../../components/layout/Footer';
import UpdateUserInfoModal from '../../components/modal/UpdateUserInfoModal.jsx';
import DeleteAccountConfirmModal from '../../components/modal/DeleteAccountConfirmModal.jsx';
import DeleteAccountSuccessModal from '../../components/modal/DeleteAccountSuccessModal.jsx';


const Modify = () => {
  const [userInfo, setUserInfo] = useState({});
  const [nickname, setNickname] = useState('');
  const [isNicknameAvailable, setIsNicknameAvailable] = useState(false);
  const [isNicknameAvailableMessage, setIsNicknameAvailableMessage] =
  useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleteSuccessOpen, setIsDeleteSuccessOpen] = useState(false);
  
  const loginState = useSelector((state) => state.loginSlice);
  const isLoggedIn = Boolean(loginState.email);
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axiosInstance.get('/api/user/profile');
        
        setUserInfo(response.data.data);
        setNickname(response.data.data.nickname);
        setIsNicknameAvailableMessage('');
        console.log('사용자 정보:', response.data.data);
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };
    if (isLoggedIn) {
      fetchUserInfo();
    }
  }, [isLoggedIn]);

  const handleNicknameCheck = async () => {
    const trimmedNickname = nickname.trim();
    setNickname(trimmedNickname);

    try {
      const response = await axiosInstance.get(
        `/api/user/profile/check?nickname=${trimmedNickname}`,
      );
      console.log('닉네임 중복 확인 응답:', response);

      setIsNicknameAvailable(true);
      setIsNicknameAvailableMessage('사용 가능한 닉네임입니다.');
    } catch (error) {
      setIsNicknameAvailable(false);

      if (error.response?.status === 400) {
        setIsNicknameAvailableMessage(error.response.data.message);
      } else {
        console.error('닉네임 중복 확인 실패:', error);
        setIsNicknameAvailableMessage('닉네임 중복 확인에 실패했습니다.');
      }
    }
  };

  const handleSubmit = async () => {
    if (!isNicknameAvailable) {
      setIsNicknameAvailableMessage('닉네임 중복 확인을 해주세요.');
      return;
    }

    try {
      const userInfoRequestDto = {
        nickname: nickname,
      };
      await axiosInstance.put('/api/user/profile', userInfoRequestDto);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to update user info:', error);
    }
  };

  // ▼ "정말로 회원탈퇴?" 모달 열기
  const handleDeleteAccount = () => {
    setIsDeleteConfirmOpen(true);
  };

  // ▼ 모달에서 [확인] 누를 때 -> 실제 탈퇴 API 호출
  const confirmDeleteAccount = async () => {
    try {
      await axiosInstance.get('/api/user/deactivate');
      console.log('회원탈퇴 성공');
      // 확인 모달 닫고 성공 모달 열기
      setIsDeleteConfirmOpen(false);
      setIsDeleteSuccessOpen(true);
    } catch (error) {
      console.error('회원탈퇴 실패:', error);
      alert('회원탈퇴에 실패했습니다. 다시 시도해주세요.');
    }
  };


  return (
    <div className="bg-white mx-auto min-h-screen flex flex-col min-w-80 max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg">
      <div className="flex-grow">
        <Header />
        <div className="px-6 bg-white">
          <div>
            <div className="mb-4">
              <label className="block text-text-400 mb-2">닉네임</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setIsNicknameAvailable(false);
                    setIsNicknameAvailableMessage('');
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={handleNicknameCheck}
                  className="bg-primary text-white px-3 py-2 rounded whitespace-nowrap flex-shrink-0"
                >
                  중복 확인
                </button>
              </div>
              {isNicknameAvailableMessage && (
                <p
                  className={`mt-2 ${isNicknameAvailable ? 'text-green-600' : 'text-red-600'}`}
                >
                  {isNicknameAvailableMessage}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-text-400 mb-2">이메일</label>
              <div className="flex flex-col items-end gap-2">
                <input
                  type="email"
                  value={userInfo.email || ''}
                  className="w-full p-2 rounded-md bg-gray-200"
                  disabled
                />
                <button
                  onClick={handleSubmit}
                  className={`px-4 py-2 ${
                    isNicknameAvailable
                      ? 'bg-primary text-white'
                      : 'bg-yellow-200 text-white cursor-not-allowed'
                  }`}
                  disabled={!isNicknameAvailable}
                  style={{
                    width: '100%',
                    maxWidth: '300px',
                    alignSelf: 'flex-end',
                  }}
                >
                  회원정보 저장하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 회원탈퇴 버튼 */}
      <div className="flex justify-end px-6 mb-4">
        <button
          onClick={handleDeleteAccount}
          className="bg-white text-gray-400 px-3 py-2 rounded text-sm"
        >
          회원탈퇴
        </button>
      </div>
      <Footer />

      <DeleteAccountConfirmModal
        isOpen={isDeleteConfirmOpen}
        onConfirm={confirmDeleteAccount}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />

      <DeleteAccountSuccessModal
        isOpen={isDeleteSuccessOpen}
        onClose={() => setIsDeleteSuccessOpen(false)}
      />
      
      <UpdateUserInfoModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};

export default Modify;