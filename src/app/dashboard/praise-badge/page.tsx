"use client";

import { useEffect, useState } from "react";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { cookieUtils } from "@/lib/cookies";
import { layout, text, grid, state } from "@/styles/design-system";
import type { PraiseMapping, PraiseBadge, PraiseHistory, PraiseRewardItem, PraiseRedemption, User } from "@/types";

type UserRole = "giver" | "receiver" | "none";

export default function PraiseBadgePage() {
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();

  const [userRole, setUserRole] = useState<UserRole>("none");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [badgeStatus, setBadgeStatus] = useState<PraiseBadge | null>(null);
  const [history, setHistory] = useState<PraiseHistory[]>([]);
  const [rewards, setRewards] = useState<PraiseRewardItem[]>([]);
  const [redemptions, setRedemptions] = useState<PraiseRedemption[]>([]);

  const [receivers, setReceivers] = useState<User[]>([]);
  const [receiverBadges, setReceiverBadges] = useState<PraiseBadge[]>([]);
  const [selectedReceiver, setSelectedReceiver] = useState("");
  const [praiseMessage, setPraiseMessage] = useState("");
  const [giving, setGiving] = useState(false);
  const [rewardItems, setRewardItems] = useState<PraiseRewardItem[]>([]);
  const [giverHistory, setGiverHistory] = useState<PraiseHistory[]>([]); // 칭찬 준 내역
  const [receiverRedemptions, setReceiverRedemptions] = useState<PraiseRedemption[]>([]); // receiver들의 보상 신청

  // 보상 아이템 관리 상태
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState<PraiseRewardItem | null>(null);
  const [rewardForm, setRewardForm] = useState({
    badgeLevel: 1,
    name: "",
    description: "",
  });
  const [savingReward, setSavingReward] = useState(false);

  useEffect(() => {
    setPageTitle("칭찬뱃지", "칭찬을 주고 받으며 보상을 받으세요");
  }, [setPageTitle]);

  useEffect(() => {
    if (user) {
      checkUserRole();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkUserRole = async () => {
    try {
      setLoading(true);
      const token = cookieUtils.getToken();

      const res = await fetch("/api/praise-badges/mappings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const mappings: PraiseMapping[] = data.data || [];

        const isReceiver = mappings.some((m) => m.isActive && m.receiverUserId === user!.id);
        const isGiver = mappings.some((m) => m.isActive && m.giverUserId === user!.id);

        if (isReceiver) {
          setUserRole("receiver");
          loadReceiverData();
        } else if (isGiver) {
          setUserRole("giver");
          loadGiverData(mappings);
        } else {
          setUserRole("none");
          setLoading(false);
        }
      }
    } catch (err) {
      setError("역할 확인 중 오류가 발생했습니다");
      console.error(err);
      setLoading(false);
    }
  };

  const loadReceiverData = async () => {
    try {
      const token = cookieUtils.getToken();
      const [badgeRes, historyRes, rewardsRes, redemptionsRes] = await Promise.all([
        fetch("/api/praise-badges", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/praise-badges?history=true", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/praise-badges/rewards", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/praise-badges/redeem", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (badgeRes.ok) {
        const data = await badgeRes.json();
        setBadgeStatus(data.data);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        const historyData = data.data || [];
        // 배열인지 확인하고, 아니면 빈 배열로 설정
        setHistory(Array.isArray(historyData) ? historyData : []);
      }

      if (rewardsRes.ok) {
        const data = await rewardsRes.json();
        setRewards(data.data || []);
      }

      if (redemptionsRes.ok) {
        const data = await redemptionsRes.json();
        setRedemptions(data.data || []);
      }
    } catch (err) {
      setError("데이터를 불러오는 중 오류가 발생했습니다");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadGiverData = async (mappings: PraiseMapping[]) => {
    try {
      const token = cookieUtils.getToken();

      const myReceiverIds = mappings
        .filter((m) => m.isActive && m.giverUserId === user!.id)
        .map((m) => m.receiverUserId);

      const [usersRes, badgesRes, rewardsRes, historyRes, redemptionsRes] = await Promise.all([
        fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/praise-badges?all=true", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/praise-badges/rewards", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/praise-badges/giver-history", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/praise-badges/receiver-redemptions", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        const allUsers: User[] = data.data || [];
        const filteredReceivers = allUsers.filter((u) => myReceiverIds.includes(u.id));
        setReceivers(filteredReceivers);

        // 1명만 있으면 자동 선택
        if (filteredReceivers.length === 1) {
          setSelectedReceiver(filteredReceivers[0].id);
        }
      }

      if (badgesRes.ok) {
        const data = await badgesRes.json();
        const allBadges: PraiseBadge[] = data.data || [];
        setReceiverBadges(allBadges.filter((b) => myReceiverIds.includes(b.userId)));
      }

      if (rewardsRes.ok) {
        const data = await rewardsRes.json();
        setRewardItems(data.data || []);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setGiverHistory(Array.isArray(data.data) ? data.data : []);
      }

      if (redemptionsRes.ok) {
        const data = await redemptionsRes.json();
        setReceiverRedemptions(Array.isArray(data.data) ? data.data : []);
      }
    } catch (err) {
      setError("데이터를 불러오는 중 오류가 발생했습니다");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGivePraise = async () => {
    if (!selectedReceiver) {
      alert("칭찬할 사람을 선택해주세요.");
      return;
    }

    try {
      setGiving(true);
      const token = cookieUtils.getToken();

      const res = await fetch("/api/praise-badges/give", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedReceiver,
          message: praiseMessage,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message);
        setPraiseMessage("");
        // 1명만 있으면 선택 유지, 여러 명이면 초기화
        if (receivers.length > 1) {
          setSelectedReceiver("");
        }
        checkUserRole();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("칭찬 처리 중 오류가 발생했습니다");
      console.error(err);
    } finally {
      setGiving(false);
    }
  };

  const handleRedeem = async (rewardId: string) => {
    if (!confirm("이 보상을 신청하시겠습니까?")) return;

    try {
      const token = cookieUtils.getToken();

      const res = await fetch("/api/praise-badges/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rewardItemId: rewardId }),
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message);
        loadReceiverData();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("신청 중 오류가 발생했습니다");
      console.error(err);
    }
  };

  const handleAddReward = () => {
    setEditingReward(null);
    setRewardForm({
      badgeLevel: 1,
      name: "",
      description: "",
    });
    setShowRewardModal(true);
  };

  const handleEditReward = (reward: PraiseRewardItem) => {
    setEditingReward(reward);
    setRewardForm({
      badgeLevel: reward.badgeLevel,
      name: reward.name,
      description: reward.description || "",
    });
    setShowRewardModal(true);
  };

  const handleSaveReward = async () => {
    if (!rewardForm.name.trim()) {
      alert("보상 아이템 이름을 입력해주세요.");
      return;
    }

    if (rewardForm.badgeLevel < 1 || rewardForm.badgeLevel > 4) {
      alert("뱃지 레벨은 1~4 사이여야 합니다.");
      return;
    }

    try {
      setSavingReward(true);
      const token = cookieUtils.getToken();

      const isEdit = !!editingReward;
      const url = "/api/praise-badges/rewards";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit
        ? {
            id: editingReward.id,
            name: rewardForm.name,
            description: rewardForm.description,
          }
        : {
            badgeLevel: rewardForm.badgeLevel,
            name: rewardForm.name,
            description: rewardForm.description,
          };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message);
        setShowRewardModal(false);
        // 데이터 다시 로드
        const mappingsRes = await fetch("/api/praise-badges/mappings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (mappingsRes.ok) {
          const mappingsData = await mappingsRes.json();
          const mappings: PraiseMapping[] = mappingsData.data || [];
          loadGiverData(mappings);
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("저장 중 오류가 발생했습니다");
      console.error(err);
    } finally {
      setSavingReward(false);
    }
  };

  const handleDeleteReward = async (rewardId: string) => {
    if (!confirm("이 보상 아이템을 삭제하시겠습니까?")) return;

    try {
      const token = cookieUtils.getToken();

      const res = await fetch(`/api/praise-badges/rewards?id=${rewardId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message);
        // 데이터 다시 로드
        const mappingsRes = await fetch("/api/praise-badges/mappings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (mappingsRes.ok) {
          const mappingsData = await mappingsRes.json();
          const mappings: PraiseMapping[] = mappingsData.data || [];
          loadGiverData(mappings);
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("삭제 중 오류가 발생했습니다");
      console.error(err);
    }
  };

  const handleToggleRewardActive = async (reward: PraiseRewardItem) => {
    try {
      const token = cookieUtils.getToken();

      const res = await fetch("/api/praise-badges/rewards", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: reward.id,
          isActive: !reward.isActive,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message);
        // 데이터 다시 로드
        const mappingsRes = await fetch("/api/praise-badges/mappings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (mappingsRes.ok) {
          const mappingsData = await mappingsRes.json();
          const mappings: PraiseMapping[] = mappingsData.data || [];
          loadGiverData(mappings);
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("수정 중 오류가 발생했습니다");
      console.error(err);
    }
  };

  const handleApproveRedemption = async (redemptionId: string, status: "approved" | "completed") => {
    const statusText = status === "approved" ? "승인" : "완료";
    if (!confirm(`이 보상 신청을 ${statusText} 처리하시겠습니까?`)) return;

    try {
      const token = cookieUtils.getToken();

      const res = await fetch("/api/praise-badges/redeem", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: redemptionId,
          status,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message);
        // 데이터 다시 로드
        checkUserRole();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("처리 중 오류가 발생했습니다");
      console.error(err);
    }
  };

  const renderReceiverView = () => {
    const pointsText = badgeStatus ? `${badgeStatus.currentPoints} / 4` : "0 / 4";

    return (
      <div className="space-y-6">
        <div className={grid.cols2}>
          <StatCard icon="⭐" label="현재 칭찬 포인트" value={pointsText} color="blue" />
          <StatCard icon="🏅" label="완성한 뱃지" value={badgeStatus?.completedBadges || 0} color="green" />
        </div>

        <Card>
          <h2 className={text.cardTitle}>📜 최근 받은 칭찬</h2>
          {!Array.isArray(history) || history.length === 0 ? (
            <p className={text.secondary}>아직 받은 칭찬이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 5).map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">칭찬 받음</span>
                    <span className={text.meta}>{new Date(item.timestamp).toLocaleDateString()}</span>
                  </div>
                  {item.comment && <p className={text.secondary}>{item.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className={text.cardTitle}>🎁 사용 가능한 보상</h2>
          {rewards.filter((r) => r.isActive).length === 0 ? (
            <p className={text.secondary}>현재 사용 가능한 보상이 없습니다</p>
          ) : (
            <div className={grid.cols2}>
              {rewards
                .filter((r) => r.isActive)
                .map((reward) => {
                  const canRedeem = badgeStatus && badgeStatus.completedBadges >= reward.badgeLevel;
                  const badgeText = `뱃지 ${reward.badgeLevel}개 필요`;

                  return (
                    <div key={reward.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-4xl mb-3">🎁</div>
                      <h3 className="font-semibold text-gray-900 mb-2">{reward.name}</h3>
                      <p className={text.tertiary + " mb-3"}>{reward.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant={canRedeem ? "green" : "gray"}>{badgeText}</Badge>
                        <Button
                          variant={canRedeem ? "primary" : "secondary"}
                          size="sm"
                          onClick={() => handleRedeem(reward.id)}
                          disabled={!canRedeem}
                        >
                          신청
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>

        <Card>
          <h2 className={text.cardTitle}>📋 신청 내역</h2>
          {redemptions.length === 0 ? (
            <p className={text.secondary}>신청 내역이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {redemptions.map((redemption) => {
                const badgeVariant =
                  redemption.status === "completed" ? "green" : redemption.status === "approved" ? "blue" : "yellow";
                const statusText =
                  redemption.status === "pending"
                    ? "승인 대기"
                    : redemption.status === "approved"
                    ? "승인 완료"
                    : "완료";

                return (
                  <div key={redemption.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{redemption.rewardItemName}</span>
                      <Badge variant={badgeVariant}>{statusText}</Badge>
                    </div>
                    <div className={"flex items-center gap-4 " + text.tertiary}>
                      <span>사용 뱃지: {redemption.badgeCount}개</span>
                      <span>신청일: {new Date(redemption.timestamp).toLocaleDateString()}</span>
                      {redemption.approvedAt && (
                        <span>승인일: {new Date(redemption.approvedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderGiverView = () => {
    return (
      <div className="space-y-6">
        <Card>
          <h2 className={text.cardTitle}>🎉 칭찬 주기</h2>
          <div className="space-y-4">
            <Select
              label="칭찬할 사람 선택"
              value={selectedReceiver}
              onChange={(e) => setSelectedReceiver(e.target.value)}
            >
              <option value="">선택해주세요</option>
              {receivers.map((receiver) => {
                const badge = receiverBadges.find((b) => b.userId === receiver.id);
                const badgeInfo = badge
                  ? ` (진행중: ${badge.currentPoints}/4, 완성: ${badge.completedBadges}개)`
                  : " (뱃지 없음)";
                return (
                  <option key={receiver.id} value={receiver.id}>
                    {receiver.name} ({receiver.username}){badgeInfo}
                  </option>
                );
              })}
            </Select>

            <Textarea
              label="칭찬 메시지 (선택사항)"
              value={praiseMessage}
              onChange={(e) => setPraiseMessage(e.target.value)}
              placeholder="잘한 일이나 칭찬할 점을 적어주세요"
              rows={3}
            />

            <Button
              variant="primary"
              onClick={handleGivePraise}
              disabled={giving || !selectedReceiver}
              className="w-full"
            >
              {giving ? "처리 중..." : "칭찬하기 ⭐"}
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className={text.cardTitle}>👥 칭찬 받는 사람들의 뱃지 현황</h2>
          {receivers.length === 0 ? (
            <p className={text.secondary}>칭찬을 줄 수 있는 사람이 없습니다</p>
          ) : (
            <div className={grid.cols2}>
              {receivers.map((receiver) => {
                const badge = receiverBadges.find((b) => b.userId === receiver.id);
                const pointsText = badge ? `${badge.currentPoints} / 4` : "0 / 4";

                return (
                  <div key={receiver.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-900">{receiver.name}</span>
                      <span className={text.tertiary}>@{receiver.username}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <span className={text.tertiary}>진행중:</span>
                        <span className="ml-2 font-bold text-yellow-600">{pointsText}</span>
                      </div>
                      <div>
                        <span className={text.tertiary}>완성:</span>
                        <span className="ml-2 font-bold text-blue-600">🏆 {badge?.completedBadges || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={text.cardTitle}>🎁 보상 아이템 목록</h2>
              <p className={text.tertiary}>받는 사람이 뱃지를 모아 신청할 수 있는 보상입니다</p>
            </div>
            <Button variant="primary" size="sm" onClick={handleAddReward}>
              + 추가
            </Button>
          </div>
          {rewardItems.length === 0 ? (
            <p className={text.secondary}>등록된 보상 아이템이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {rewardItems
                .sort((a, b) => a.badgeLevel - b.badgeLevel || a.order - b.order)
                .map((reward) => (
                  <div
                    key={reward.id}
                    className={`p-3 rounded-lg flex items-center justify-between ${
                      reward.isActive ? "bg-gray-50" : "bg-gray-100 opacity-60"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{reward.name}</span>
                        {!reward.isActive && <Badge variant="gray">비활성</Badge>}
                      </div>
                      {reward.description && (
                        <span className={text.tertiary + " block mt-1"}>{reward.description}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="blue">🏆 {reward.badgeLevel}개</Badge>
                      <Button variant="secondary" size="sm" onClick={() => handleEditReward(reward)} className="px-3">
                        수정
                      </Button>
                      <Button
                        variant={reward.isActive ? "secondary" : "primary"}
                        size="sm"
                        onClick={() => handleToggleRewardActive(reward)}
                        className="px-3"
                      >
                        {reward.isActive ? "비활성화" : "활성화"}
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteReward(reward.id)} className="px-3">
                        삭제
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className={text.cardTitle}>🎁 보상 신청 내역</h2>
          {!Array.isArray(receiverRedemptions) || receiverRedemptions.length === 0 ? (
            <p className={text.secondary}>아직 보상 신청 내역이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {receiverRedemptions.map((redemption: any) => {
                const badgeVariant =
                  redemption.status === "completed" ? "green" : redemption.status === "approved" ? "blue" : "yellow";
                const statusText =
                  redemption.status === "pending"
                    ? "승인 대기"
                    : redemption.status === "approved"
                    ? "승인 완료"
                    : "완료";

                return (
                  <div key={redemption.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-gray-900">{redemption.receiverName}</span>
                        <span className={text.tertiary + " ml-2"}>@{redemption.receiverUsername}</span>
                      </div>
                      <Badge variant={badgeVariant}>{statusText}</Badge>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold text-gray-900">{redemption.rewardItemName}</span>
                    </div>
                    <div className={"flex items-center gap-4 mb-3 " + text.tertiary}>
                      <span>사용 뱃지: {redemption.badgeCount}개</span>
                      <span>신청일: {new Date(redemption.timestamp).toLocaleDateString()}</span>
                      {redemption.approvedAt && (
                        <span>승인일: {new Date(redemption.approvedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                    {redemption.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApproveRedemption(redemption.id, "approved")}
                        >
                          승인
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleApproveRedemption(redemption.id, "completed")}
                        >
                          완료 처리
                        </Button>
                      </div>
                    )}
                    {redemption.status === "approved" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApproveRedemption(redemption.id, "completed")}
                      >
                        완료 처리
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <h2 className={text.cardTitle}>📜 칭찬 준 내역</h2>
          {!Array.isArray(giverHistory) || giverHistory.length === 0 ? (
            <p className={text.secondary}>아직 칭찬을 준 내역이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {giverHistory.slice(0, 10).map((item: any) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-gray-900">{item.receiverName}</span>
                      <span className={text.tertiary + " ml-2"}>@{item.receiverUsername}</span>
                    </div>
                    <span className={text.meta}>{new Date(item.timestamp).toLocaleDateString()}</span>
                  </div>
                  {item.comment && <p className={text.secondary}>{item.comment}</p>}
                  <div className={"flex items-center gap-3 mt-2 " + text.tertiary}>
                    <span>포인트: {item.pointsAfter}/4</span>
                    <span>완성 뱃지: {item.badgesAfter}개</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className={layout.page}>
          <main className={layout.container}>
            <p className={state.loading}>로딩 중...</p>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className={layout.page}>
          <main className={layout.container}>
            <p className={text.error}>{error}</p>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (userRole === "none") {
    return (
      <ProtectedRoute>
        <div className={layout.page}>
          <main className={layout.container}>
            <Card>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className={text.sectionTitle + " mb-4"}>칭찬뱃지 앱</h2>
                <p className={text.secondary + " mb-2"}>현재 칭찬뱃지 시스템에 등록되지 않았습니다.</p>
                <p className={text.tertiary}>관리자에게 문의하여 칭찬을 주는 사람 또는 받는 사람으로 등록해주세요.</p>
              </div>
            </Card>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className={layout.page}>
        <main className={layout.container}>
          <div className="mb-6">
            <h1 className={text.pageTitle}>🏆 칭찬뱃지</h1>
            <p className={text.description}>
              {userRole === "receiver"
                ? "칭찬을 모아 뱃지를 완성하고 보상을 받으세요"
                : "칭찬을 주고 보상 아이템을 지정하세요"}
            </p>
            <div className="mt-2">
              <Badge variant={userRole === "receiver" ? "blue" : "green"}>
                {userRole === "receiver" ? "칭찬 받는 사람" : "칭찬 주는 사람"}
              </Badge>
            </div>
          </div>

          {userRole === "receiver" ? renderReceiverView() : renderGiverView()}
        </main>
      </div>

      {/* 보상 아이템 추가/수정 모달 */}
      <Modal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        title={editingReward ? "보상 아이템 수정" : "보상 아이템 추가"}
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowRewardModal(false)}>
              취소
            </Button>
            <Button variant="primary" onClick={handleSaveReward} disabled={savingReward}>
              {savingReward ? "저장 중..." : "저장"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {!editingReward && (
            <Select
              label="필요한 뱃지 개수"
              value={rewardForm.badgeLevel}
              onChange={(e) =>
                setRewardForm({
                  ...rewardForm,
                  badgeLevel: Number(e.target.value),
                })
              }
            >
              <option value={1}>1개</option>
              <option value={2}>2개</option>
              <option value={3}>3개</option>
              <option value={4}>4개</option>
            </Select>
          )}

          <Input
            label="보상 이름"
            value={rewardForm.name}
            onChange={(e) =>
              setRewardForm({
                ...rewardForm,
                name: e.target.value,
              })
            }
            placeholder="예: 아이스크림 쿠폰"
          />

          <Textarea
            label="설명 (선택사항)"
            value={rewardForm.description}
            onChange={(e) =>
              setRewardForm({
                ...rewardForm,
                description: e.target.value,
              })
            }
            placeholder="보상에 대한 설명을 입력하세요"
            rows={3}
          />
        </div>
      </Modal>
    </ProtectedRoute>
  );
}
