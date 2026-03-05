import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './DonationTracker.css';

const DonationTracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedDonation, setExpandedDonation] = useState(null);

  useEffect(() => {
    if (!user?.address) {
      navigate('/login');
      return;
    }
    fetchDonations();
  }, [user, navigate]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proofs/donor/${user.address}`);
      if (!response.ok) throw new Error('Failed to fetch donations');
      const data = await response.json();
      setDonations(data.proofs || []);
    } catch (err) {
      console.error('Error fetching donations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { class: 'status-pending', icon: '⏳', text: 'Awaiting Proof' },
      submitted: { class: 'status-submitted', icon: '📤', text: 'Proof Submitted' },
      verified: { class: 'status-verified', icon: '✅', text: 'Verified' },
      rejected: { class: 'status-rejected', icon: '❌', text: 'Proof Rejected' },
      released: { class: 'status-released', icon: '💰', text: 'Funds Released' },
      refunded: { class: 'status-refunded', icon: '↩️', text: 'Refunded' },
    };
    return statusMap[status] || { class: 'status-unknown', icon: '❓', text: status };
  };

  const filteredDonations = donations.filter(donation => {
    if (filter === 'all') return true;
    return donation.status === filter;
  });

  const getDaysRemaining = (expiresAt) => {
    const now = new Date();
    const expire = new Date(expiresAt);
    const daysLeft = Math.ceil((expire - now) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  };

  const handleRefund = async (donation) => {
    if (window.confirm('Request refund for this donation?')) {
      try {
        // Call blockchain refund function
        console.log('Refund initiated for donation:', donation);
      } catch (err) {
        console.error('Error initiating refund:', err);
      }
    }
  };

  if (loading) {
    return <div className="donation-tracker-container"><p>Loading your donations...</p></div>;
  }

  return (
    <div className="donation-tracker-container">
      <div className="tracker-header">
        <h2>Transaction Authenticity Tracker 🔍</h2>
        <p>Monitor where your donations go and verify fund usage</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{donations.length}</div>
          <div className="stat-label">Total Donations</div>
        </div>
        <div className="stat-card verified">
          <div className="stat-number">{donations.filter(d => d.status === 'verified').length}</div>
          <div className="stat-label">Verified & Released</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-number">{donations.filter(d => ['pending', 'submitted'].includes(d.status)).length}</div>
          <div className="stat-label">Awaiting Verification</div>
        </div>
        <div className="stat-card rejected">
          <div className="stat-number">{donations.filter(d => d.status === 'rejected').length}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="filter-buttons">
        {['all', 'pending', 'submitted', 'verified', 'rejected', 'refunded'].map(status => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Donations List */}
      <div className="donations-list">
        {filteredDonations.length === 0 ? (
          <div className="empty-state">
            <p>No donations found with this status</p>
          </div>
        ) : (
          filteredDonations.map(donation => {
            const statusInfo = getStatusBadge(donation.status);
            const daysLeft = getDaysRemaining(donation.expiresAt);
            return (
              <div key={donation._id} className="donation-card">
                <div className="donation-header">
                  <div className="donation-info">
                    <h3>Project ID: {donation.projectId}</h3>
                    <p className="donation-id">Donation #{donation.donationId}</p>
                  </div>
                  <div className={`status-badge ${statusInfo.class}`}>
                    <span className="status-icon">{statusInfo.icon}</span>
                    <span className="status-text">{statusInfo.text}</span>
                  </div>
                </div>

                <div className="donation-details">
                  <div className="detail-item">
                    <span className="label">Amount Donated:</span>
                    <span className="value">{(parseInt(donation.donationAmount) / 1e18).toFixed(4)} ETH</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Donated on:</span>
                    <span className="value">{new Date(donation.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="status-timeline">
                  <div className={`timeline-step ${['submitted', 'verified'].includes(donation.status) ? 'completed' : ''}`}>
                    <div className="timeline-marker">1</div>
                    <div className="timeline-label">NGO Submits Proof</div>
                  </div>
                  <div className={`timeline-step ${donation.status === 'verified' ? 'completed' : ''}`}>
                    <div className="timeline-marker">2</div>
                    <div className="timeline-label">Proof Verified</div>
                  </div>
                  <div className={`timeline-step ${donation.status === 'released' ? 'completed' : ''}`}>
                    <div className="timeline-marker">3</div>
                    <div className="timeline-label">Funds Released</div>
                  </div>
                </div>

                {/* Emergency Refund Info */}
                {daysLeft > 0 && ['pending', 'submitted'].includes(donation.status) && (
                  <div className="refund-info">
                    <p>⏰ Proof submission deadline: {daysLeft} days remaining</p>
                    {daysLeft <= 3 && (
                      <button className="refund-btn" onClick={() => handleRefund(donation)}>
                        Request Refund
                      </button>
                    )}
                  </div>
                )}

                {/* Verification Reason (if rejected) */}
                {donation.status === 'rejected' && (
                  <div className="rejection-info">
                    <p><strong>Reason:</strong> {donation.verificationReason || 'No reason provided'}</p>
                    {daysLeft === 0 && (
                      <button className="refund-btn" onClick={() => handleRefund(donation)}>
                        Claim Refund
                      </button>
                    )}
                  </div>
                )}

                {/* Expand/Collapse Details */}
                <button
                  className="expand-btn"
                  onClick={() => setExpandedDonation(expandedDonation === donation._id ? null : donation._id)}
                >
                  {expandedDonation === donation._id ? '- Hide Details' : '+ View Details'}
                </button>

                {expandedDonation === donation._id && (
                  <div className="expanded-details">
                    <div className="detail-block">
                      <h4>Proof Information</h4>
                      {donation.proofType && (
                        <>
                          <p><strong>Type:</strong> {donation.proofType}</p>
                          <p><strong>Submitted:</strong> {donation.submittedAt ? new Date(donation.submittedAt).toLocaleString() : 'Not submitted'}</p>
                          {donation.verifiedAt && (
                            <p><strong>Verified:</strong> {new Date(donation.verifiedAt).toLocaleString()}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Help Section */}
      <div className="help-section">
        <h3>🔐 How Transaction Verification Works</h3>
        <div className="help-text">
          <p><strong>Step 1:</strong> You donate funds → Money is held in escrow (secure holding)</p>
          <p><strong>Step 2:</strong> NGO submits proof (receipt, video, documents) showing the work was done</p>
          <p><strong>Step 3:</strong> Proof is automatically verified by system</p>
          <p><strong>Step 4:</strong> Once verified, your money is released to the NGO</p>
          <p><strong>Important:</strong> If proof is not submitted within 30 days or is rejected, your funds are automatically refunded!</p>
        </div>
      </div>
    </div>
  );
};

export default DonationTracker;
