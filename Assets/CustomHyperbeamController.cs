using System;
using System.Runtime.InteropServices;
using Hyperbeam;
using JetBrains.Annotations;
using UnityEngine;

public class CustomHyperbeamController : MonoBehaviour
{
    public GameObject player;
    public HyperbeamController controller;
    public float resumeDistance;
    public float disconnectDistance;

    private bool _isDisconnected;
    private string _embedUrl = "";

    [DllImport("__Internal")]
    private static extern void getDemoLink(string objName);
    
    private void Start()
    {
        StartHyperbeam();
    }

    private void StartHyperbeam()
    {
        if (_embedUrl == "")
        {
            getDemoLink(gameObject.name);
            return;
        }
        
        _isDisconnected = false;

        Debug.Log($"embedUrl: {_embedUrl}");
        controller.StartHyperbeamStream(_embedUrl);
        Debug.Log("hyperbeam starting...");
    }

    private void Update()
    {
        var distance = Vector3.Distance(player.gameObject.transform.position, transform.position);
        if (_isDisconnected)
        {
            if (distance > resumeDistance) return;
            StartHyperbeam();
        }
        else
        {
            if (distance < disconnectDistance) return;
            controller.DisposeInstance();
            Debug.Log("Disposing controller hyperbeam instance...");
            _isDisconnected = true;
        }
    }

    [UsedImplicitly]
    public void OnDemoLink(string demoLink)
    {
        _embedUrl = demoLink;
        StartHyperbeam();
    }
}